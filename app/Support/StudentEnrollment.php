<?php

namespace App\Support;

use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\Enrollment;
use App\Models\EvaluationPlanScore;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Inscripción de materias del siguiente período académico.
 *
 * El estudiante dispone de las unidades de crédito (UC) del período que le
 * corresponde cursar. Las materias aplazadas se reservan primero y quedan
 * bloqueadas; el resto de las UC se reparte entre las materias del siguiente
 * período, que el estudiante puede marcar o desmarcar mientras la ventana de
 * inscripciones esté habilitada.
 */
final class StudentEnrollment
{
    /**
     * Materia aplazada en un período anterior: consume UC y no se puede quitar.
     */
    public const KIND_FAILED = 'failed';

    /**
     * Materia del siguiente período o ya inscrita en el período destino.
     */
    public const KIND_NEXT = 'next';

    /**
     * Veces que puede cursarse una materia reprobada antes de la suspensión.
     */
    public const MAX_FAILED_ATTEMPTS = 3;

    /**
     * Entidad académica que se imprime en la planilla institucional.
     */
    public const ENTITY = 'EA La Guaira';

    /**
     * Estado calculado una sola vez por solicitud.
     *
     * @var array<string, mixed>|null
     */
    private ?array $state = null;

    public function __construct(private readonly User $student) {}

    /**
     * Inscripción del estudiante autenticado.
     */
    public static function for(User $student): self
    {
        return new self($student);
    }

    /**
     * Datos que consume la página de inscripciones.
     *
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $state = $this->state();
        $window = new AdmissionWindow;

        $subjects = $state['failed']
            ->map(fn (Subject $subject): array => $this->subjectRow($subject, self::KIND_FAILED, $state))
            ->concat($state['next']->map(
                fn (Subject $subject): array => $this->subjectRow($subject, self::KIND_NEXT, $state),
            ))
            ->values()
            ->all();

        return [
            'window' => [
                'is_open' => $window->isEnrollmentOpen(),
                'opens_at' => $window->enrollmentOpensAt()->format('d/m/Y'),
                'closes_at' => $window->enrollmentClosesAt()->format('d/m/Y'),
                'reason' => $window->enrollmentClosureContext()['reason'],
            ],
            'period' => $state['period'] !== null ? [
                'id' => $state['period']->id,
                'name' => $state['period']->name,
                'starts_at' => $state['period']->starts_at->format('d/m/Y'),
                'ends_at' => $state['period']->ends_at->format('d/m/Y'),
            ] : null,
            'student' => [
                'name' => $this->student->name,
                'identity_document' => $this->identityDocument($state),
                'student_code' => $state['profile']?->student_code,
                'career' => $state['profile']?->career?->name,
                'career_code' => $state['profile']?->career?->code,
                'current_semester' => $state['profile'] !== null ? (int) $state['profile']->current_semester : null,
                'next_semester' => $state['semester'],
                'cohort' => $state['profile']?->cohort,
                'modality' => $state['admission']?->modalityLabel() ?? $state['profile']?->career?->modalityLabel(),
                'shift' => $state['profile']?->shift ?? $state['admission']?->shiftLabel(),
            ],
            'semester' => $state['semester'],
            'credits' => [
                'budget' => $state['budget'],
                'required' => $state['required_credits'],
                'available' => max(0, $state['budget'] - $state['required_credits']),
                'selected' => $state['selected_credits'],
                'approved' => $state['approved_credits'],
                'total' => $state['total_credits'],
            ],
            'subjects' => $subjects,
            'suspension' => [
                'is_suspended' => $state['suspended']->isNotEmpty(),
                'subjects' => $state['suspended']
                    ->map(fn (Subject $subject): string => $this->subjectLabel($subject))
                    ->values()
                    ->all(),
                'message' => $state['suspended']->isNotEmpty()
                    ? $this->suspensionMessage($state['suspended'])
                    : null,
            ],
            'submitted' => $state['submitted'],
            'sheet' => $state['submitted'] ? $this->sheetFrom($state) : null,
            'urls' => [
                'store' => route('student.enrollment.store', absolute: false),
                'sheet' => route('student.enrollment.sheet', absolute: false),
            ],
        ];
    }

    /**
     * Registra la selección de materias del estudiante.
     *
     * @param  array<int, int|string>  $subjectIds
     *
     * @throws ValidationException
     */
    public function save(array $subjectIds): void
    {
        $state = $this->state();
        $period = $state['period'];

        if ($state['suspended']->isNotEmpty()) {
            throw ValidationException::withMessages([
                'subjects' => $this->suspensionMessage($state['suspended']),
            ]);
        }

        if ($period === null) {
            throw ValidationException::withMessages([
                'subjects' => 'No hay un período académico disponible para inscribir materias.',
            ]);
        }

        /** @var Collection<int, Subject> $candidates */
        $candidates = $state['failed']
            ->concat($state['next'])
            ->unique('id')
            ->keyBy('id');

        $selectedIds = collect($subjectIds)
            ->map(static fn (int|string $id): int => (int) $id)
            ->unique()
            ->values();

        $unknown = $selectedIds->diff($candidates->keys());

        if ($unknown->isNotEmpty()) {
            throw ValidationException::withMessages([
                'subjects' => 'La selección incluye materias que no corresponden a tu inscripción.',
            ]);
        }

        $missing = $state['failed']->pluck('id')->diff($selectedIds);

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'subjects' => 'Debes inscribir las materias aplazadas: '.$state['failed']
                    ->whereIn('id', $missing->all())
                    ->pluck('code')
                    ->implode(', ').'.',
            ]);
        }

        if ($candidates->isEmpty()) {
            throw ValidationException::withMessages([
                'subjects' => 'No hay materias disponibles para inscribir en este período.',
            ]);
        }

        $credits = $selectedIds->sum(
            static fn (int $id): int => (int) ($candidates->get($id)?->credits ?? 0),
        );

        if ($credits > $state['budget']) {
            throw ValidationException::withMessages([
                'subjects' => sprintf(
                    'La selección suma %d UC y el período admite %d UC.',
                    $credits,
                    $state['budget'],
                ),
            ]);
        }

        if ($selectedIds->isEmpty() && $candidates->isNotEmpty()) {
            throw ValidationException::withMessages([
                'subjects' => 'Selecciona al menos una materia para continuar.',
            ]);
        }

        $optionalIds = $state['next']->pluck('id');

        DB::transaction(function () use ($candidates, $optionalIds, $period, $selectedIds, $state): void {
            foreach ($selectedIds as $subjectId) {
                $subject = $candidates->get($subjectId);

                Enrollment::query()->firstOrCreate(
                    [
                        'student_id' => $this->student->id,
                        'subject_id' => $subjectId,
                        'academic_period_id' => $period->id,
                    ],
                    [
                        'professor_id' => $subject?->professors->first()?->id,
                        'status' => 'cursando',
                    ],
                );
            }

            /** @var Enrollment $enrollment */
            foreach ($state['existing'] as $enrollment) {
                if (! $optionalIds->contains($enrollment->subject_id)) {
                    continue;
                }

                if ($selectedIds->contains((int) $enrollment->subject_id)) {
                    continue;
                }

                $hasScores = EvaluationPlanScore::query()
                    ->where('enrollment_id', $enrollment->id)
                    ->exists();

                if ($enrollment->status !== 'cursando' || $hasScores) {
                    throw ValidationException::withMessages([
                        'subjects' => 'No puedes quitar '.($enrollment->subject?->name ?? 'esta materia')
                            .': la materia ya tiene calificaciones registradas.',
                    ]);
                }

                $enrollment->delete();
            }
        });

        $this->state = null;
    }

    /**
     * Datos de la planilla de inscripción.
     *
     * @return array<string, mixed>
     */
    public function sheet(): array
    {
        return $this->sheetFrom($this->state());
    }

    /**
     * Fila de una materia dentro de la selección.
     *
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    private function subjectRow(Subject $subject, string $kind, array $state): array
    {
        $condition = $state['subject_conditions'][$subject->id] ?? null;
        $enrollment = $state['existing']->firstWhere('subject_id', $subject->id);

        return [
            'subject_id' => $subject->id,
            'code' => (string) $subject->code,
            'name' => $this->subjectLabel($subject),
            'credits' => (int) $subject->credits,
            'semester' => (int) $subject->semester,
            'professor' => $enrollment?->professor?->name ?? $subject->professors->first()?->name,
            'kind' => $kind,
            'is_locked' => $kind === self::KIND_FAILED,
            'is_selected' => in_array($subject->id, $state['selected'], true),
            'has_enrollment' => $enrollment !== null,
            'definitive' => $condition['definitive'] ?? null,
            'previous_period' => $condition['period'] ?? null,
            'attempts' => (int) ($condition['attempts'] ?? 0),
        ];
    }

    /**
     * Planilla de Asesoría Académica e Inscripción (Diseño 2015).
     *
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    private function sheetFrom(array $state): array
    {
        /** @var Collection<int, Enrollment> $enrollments */
        $enrollments = $state['existing']
            ->reject(static fn (Enrollment $enrollment): bool => ($state['subject_conditions'][(int) $enrollment->subject_id]['approved'] ?? false) === true)
            ->sortBy(static fn (Enrollment $enrollment): array => [
                (int) ($enrollment->subject?->semester ?? 0),
                (string) ($enrollment->subject?->code ?? ''),
            ])
            ->values();

        $rows = $enrollments->map(fn (Enrollment $enrollment): array => [
            'pa' => (int) ($enrollment->subject?->semester ?? 0),
            'name' => $enrollment->subject !== null ? $this->subjectLabel($enrollment->subject) : '',
            'component' => (string) ($enrollment->subject?->component ?? ''),
            'type' => (string) ($enrollment->subject?->type ?? ''),
            'credits' => (int) ($enrollment->subject?->credits ?? 0),
            'enrolled' => true,
        ])->values()->all();

        $names = $this->nameParts($state['admission']);
        $birthDate = $state['profile']?->birth_date ?? $state['admission']?->birth_date;

        return [
            'student' => [
                'identity_document' => $this->identityDocument($state),
                'period' => $state['period']?->name,
                'cohort' => $state['profile']?->cohort,
                'specialty' => $this->uppercase($state['profile']?->career?->name),
                'entity' => self::ENTITY,
                'first_surname' => $names['first_surname'],
                'second_surname' => $names['second_surname'],
                'first_name' => $names['first_name'],
                'second_name' => $names['second_name'],
                'birth_date' => $birthDate?->format('d-m-Y'),
                'civil_status' => $state['admission']?->maritalStatusLabel() ?? '',
                'sex' => $this->sex($state['admission']),
                'phone' => $state['profile']?->phone ?? $state['admission']?->phone,
                'email' => $state['profile']?->personal_email
                    ?? $state['admission']?->email
                    ?? $this->student->email,
                'address' => $state['profile']?->address ?? $state['admission']?->address,
            ],
            'period' => $state['period']?->name,
            'rows' => $rows,
            'total_credits' => array_sum(array_column($rows, 'credits')),
        ];
    }

    /**
     * Nombre legible de la materia, con las electivas resueltas.
     */
    private function subjectLabel(Subject $subject): string
    {
        return $subject->isElectiveSlot() ? $subject->electiveLabel() : (string) $subject->name;
    }

    /**
     * Mensaje de suspensión con las materias reprobadas tres veces.
     *
     * @param  Collection<int, Subject>  $subjects
     */
    private function suspensionMessage(Collection $subjects): string
    {
        $names = $subjects
            ->map(fn (Subject $subject): string => $this->subjectLabel($subject))
            ->implode(', ');

        return 'Has reprobado la o las materias: '.$names.'. Debes dirigirte a control de estudios.';
    }

    /**
     * Nombres y apellidos separados como los exige la planilla.
     *
     * @return array{first_surname: string, second_surname: string, first_name: string, second_name: string}
     */
    private function nameParts(?Admission $admission): array
    {
        $first = $admission?->first_name;
        $last = $admission?->last_name;

        if ($first === null || $last === null) {
            $parts = preg_split('/\s+/', trim($this->student->name)) ?: [];
            $first = $parts[0] ?? '';
            $last = implode(' ', array_slice($parts, 1));
        }

        $names = preg_split('/\s+/', trim((string) $first)) ?: [];
        $surnames = preg_split('/\s+/', trim((string) $last)) ?: [];

        return [
            'first_surname' => $this->uppercase($surnames[0] ?? ''),
            'second_surname' => $this->uppercase(implode(' ', array_slice($surnames, 1))),
            'first_name' => $this->uppercase($names[0] ?? ''),
            'second_name' => $this->uppercase(implode(' ', array_slice($names, 1))),
        ];
    }

    private function uppercase(?string $value): string
    {
        $value = trim((string) $value);

        return $value === '' ? '' : Str::upper($value);
    }

    /**
     * Sexo de la planilla (M/F) a partir del género registrado en la admisión.
     */
    private function sex(?Admission $admission): string
    {
        return match ($admission?->gender) {
            'masculino' => 'M',
            'femenino' => 'F',
            default => '',
        };
    }

    /**
     * Documento de identidad del estudiante.
     *
     * @param  array<string, mixed>  $state
     */
    private function identityDocument(array $state): ?string
    {
        if ($state['admission'] !== null) {
            $digits = preg_replace('/\D/', '', (string) $state['admission']->id_number) ?? '';

            if ($digits !== '') {
                return strtoupper((string) $state['admission']->nationality).$digits;
            }
        }

        $document = $state['profile']?->identity_document;

        if (is_string($document) && trim($document) !== '') {
            return $document;
        }

        return null;
    }

    /**
     * Calcula el período destino, las materias y la selección inicial.
     *
     * @return array<string, mixed>
     */
    private function state(): array
    {
        if ($this->state !== null) {
            return $this->state;
        }

        /** @var StudentProfile|null $profile */
        $profile = $this->student->studentProfile()->with('career')->first();

        /** @var Collection<int, Enrollment> $enrollments */
        $enrollments = Enrollment::query()
            ->with(['subject', 'academicPeriod', 'professor'])
            ->where('student_id', $this->student->id)
            ->get();

        $grades = StudentGrades::breakdown($enrollments);
        [$conditions, $approvedCredits] = $this->conditions($enrollments, $grades);

        $period = $this->targetPeriod($enrollments);
        $semester = $this->nextSemester($profile, $enrollments, $period);

        $careerId = $profile?->career_id;

        $careerSubjects = $careerId !== null
            ? Subject::query()
                ->where('career_id', $careerId)
                ->pensumBase()
                ->with('professors:id,name')
                ->get()
                ->sortBy('code')
                ->sortBy('semester')
                ->values()
            : collect();

        $periodSubjects = $careerSubjects->where('semester', $semester);
        $budget = (int) $periodSubjects->sum('credits');

        $failed = $careerSubjects
            ->filter(static fn (Subject $subject): bool => ($conditions[$subject->id]['failed'] ?? false) === true)
            ->values();

        $next = $periodSubjects
            ->reject(static fn (Subject $subject): bool => ($conditions[$subject->id]['approved'] ?? false) === true)
            ->reject(static fn (Subject $subject): bool => ($conditions[$subject->id]['failed'] ?? false) === true)
            ->values();

        $existing = $period !== null
            ? $enrollments->where('academic_period_id', $period->id)->values()
            : collect();

        // Una nota corregida a aprobado debe desaparecer de inmediato tanto de
        // "materias a cursar" como de la planilla. Las inscripciones aprobadas
        // se conservan en la base de datos como historial, pero no cuentan como
        // matrícula vigente del período destino.
        $active = $existing
            ->reject(static fn (Enrollment $enrollment): bool => ($conditions[(int) $enrollment->subject_id]['approved'] ?? false) === true)
            ->values();

        // Materias ya inscritas en el período destino que no forman parte del
        // pensum del siguiente semestre (reinscripciones de otros períodos).
        $extra = $active
            ->map(static fn (Enrollment $enrollment): ?Subject => $enrollment->subject)
            ->filter()
            ->reject(static fn (Subject $subject): bool => ($conditions[$subject->id]['approved'] ?? false) === true)
            ->reject(static fn (Subject $subject): bool => $failed->contains('id', $subject->id))
            ->reject(static fn (Subject $subject): bool => $next->contains('id', $subject->id));

        $next = $next->concat($extra)
            ->unique('id')
            ->sortBy('code')
            ->sortBy('semester')
            ->values();

        $requiredCredits = (int) $failed->sum('credits');
        $selected = $this->initialSelection($failed, $next, $active, (int) $budget, (int) $requiredCredits);

        $selectedCredits = $failed
            ->concat($next)
            ->whereIn('id', $selected)
            ->sum('credits');

        $suspended = $careerSubjects
            ->filter(static fn (Subject $subject): bool => ($conditions[$subject->id]['failed'] ?? false) === true
                && (int) ($conditions[$subject->id]['attempts'] ?? 0) >= self::MAX_FAILED_ATTEMPTS)
            ->values();

        return $this->state = [
            'profile' => $profile,
            'admission' => Admission::query()
                ->where('converted_user_id', $this->student->id)
                ->latest()
                ->first(),
            'enrollments' => $enrollments,
            'grades' => $grades,
            'subject_conditions' => $conditions,
            'period' => $period,
            'semester' => $semester,
            'budget' => $budget,
            'failed' => $failed,
            'next' => $next,
            'existing' => $active,
            'selected' => $selected,
            'selected_credits' => (int) $selectedCredits,
            'required_credits' => $requiredCredits,
            'approved_credits' => $approvedCredits,
            'total_credits' => (int) $careerSubjects->sum('credits'),
            'suspended' => $suspended,
            'submitted' => $active->isNotEmpty(),
        ];
    }

    /**
     * Condición final de cada materia y UC aprobadas.
     *
     * Una materia aprobada en cualquier período deja de estar aplazada; una
     * materia reprobada sin aprobación posterior se considera pendiente.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @param  array<int, array<string, mixed>>  $grades
     * @return array{0: array<int, array{approved: bool, failed: bool, attempts: int, definitive: float|null, period: string|null}>, 1: int}
     */
    private function conditions(Collection $enrollments, array $grades): array
    {
        $conditions = [];

        foreach ($enrollments as $enrollment) {
            $subjectId = (int) $enrollment->subject_id;
            $condition = $grades[$enrollment->id]['condition'] ?? $enrollment->status;
            $definitive = $grades[$enrollment->id]['definitive'] ?? null;
            $entry = $conditions[$subjectId] ?? [
                'approved' => false,
                'failed' => false,
                'attempts' => 0,
                'definitive' => null,
                'period' => null,
            ];

            if ($condition === 'aprobado') {
                $entry['approved'] = true;
                $entry['failed'] = false;
                $entry['definitive'] = $definitive ?? $entry['definitive'];
            } elseif ($condition === 'reprobado' && ! $entry['approved']) {
                $entry['failed'] = true;
                $entry['attempts']++;
                $entry['definitive'] = $entry['definitive'] ?? $definitive;
                $entry['period'] = $enrollment->academicPeriod?->name ?? $entry['period'];
            }

            $conditions[$subjectId] = $entry;
        }

        $approvedCredits = $enrollments
            ->filter(static fn (Enrollment $enrollment): bool => ($conditions[(int) $enrollment->subject_id]['approved'] ?? false) === true)
            ->unique('subject_id')
            ->sum(static fn (Enrollment $enrollment): int => (int) ($enrollment->subject?->credits ?? 0));

        return [$conditions, (int) $approvedCredits];
    }

    /**
     * Período destino: el activo mientras el estudiante no tenga períodos más
     * recientes y, si ya está cursado, el siguiente período calendario.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     */
    private function targetPeriod(Collection $enrollments): ?AcademicPeriod
    {
        $last = $enrollments
            ->map(static fn (Enrollment $enrollment): ?AcademicPeriod => $enrollment->academicPeriod)
            ->filter()
            ->sortByDesc(static fn (AcademicPeriod $period): int => $period->starts_at->getTimestamp())
            ->first();

        $active = AcademicPeriod::query()
            ->where('is_active', true)
            ->orderByDesc('starts_at')
            ->first();

        if ($last === null) {
            return $active ?? AcademicPeriod::query()->orderByDesc('starts_at')->first();
        }

        // El período activo sigue siendo el destino mientras el estudiante no
        // tenga matrículas en períodos posteriores (incluidas las que acaba de
        // registrar en esta misma ventana).
        if ($active !== null && ! $last->starts_at->greaterThan($active->starts_at)) {
            return $active;
        }

        return AcademicPeriod::query()
            ->where('starts_at', '>', $last->starts_at)
            ->orderBy('starts_at')
            ->first();
    }

    /**
     * Semestre del pensum que corresponde inscribir.
     *
     * Cuando ya hay materias registradas en el período destino se conserva el
     * semestre de esas materias para que la página no salte de semestre al
     * guardar la inscripción.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     */
    private function nextSemester(?StudentProfile $profile, Collection $enrollments, ?AcademicPeriod $period): int
    {
        $current = max(1, (int) ($profile?->current_semester ?? 1));
        $duration = (int) ($profile?->career?->duration_semesters ?? 0);

        $inTarget = $period !== null
            ? $enrollments
                ->where('academic_period_id', $period->id)
                ->map(static fn (Enrollment $enrollment): int => (int) ($enrollment->subject?->semester ?? 0))
                ->filter(static fn (int $semester): bool => $semester > 0)
                ->max()
            : null;

        if ($inTarget !== null) {
            return $duration > 0 ? min($inTarget, $duration) : $inTarget;
        }

        if ($enrollments->isEmpty()) {
            return $current;
        }

        $semester = $current + 1;

        return $duration > 0 ? min($semester, $duration) : $semester;
    }

    /**
     * Selección inicial: las aplazadas siempre y, si no hay historial en el
     * período destino, se completan las UC con las materias del siguiente
     * semestre en orden de pensum.
     *
     * @param  Collection<int, Subject>  $failed
     * @param  Collection<int, Subject>  $next
     * @param  Collection<int, Enrollment>  $existing
     * @return array<int, int>
     */
    private function initialSelection(Collection $failed, Collection $next, Collection $existing, int $budget, int $required): array
    {
        $selected = $failed->pluck('id')->all();

        if ($existing->isEmpty()) {
            $used = $required;

            foreach ($next as $subject) {
                if ($used + (int) $subject->credits > $budget) {
                    continue;
                }

                $selected[] = $subject->id;
                $used += (int) $subject->credits;
            }

            return array_values(array_unique($selected));
        }

        $enrolledIds = $existing->pluck('subject_id')->map(static fn ($id): int => (int) $id)->all();

        foreach ($next as $subject) {
            if (in_array($subject->id, $enrolledIds, true)) {
                $selected[] = $subject->id;
            }
        }

        return array_values(array_unique($selected));
    }
}
