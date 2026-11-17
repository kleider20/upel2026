<?php

namespace App\Http\Controllers\Student;

use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;
use App\Notifications\SchedulePublishedNotification;
use App\Support\AdmissionTimeline;
use App\Support\StudentGrades;
use App\Support\StudentSchedule;
use App\Support\SubjectCode;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Página de inicio del portal: resumen personal del estudiante.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/dashboard/index');
    }

    /**
     * Página del expediente de admisión.
     */
    public function solicitud(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/solicitud/index');
    }

    /**
     * Página de materias inscritas del período.
     */
    public function materias(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/materias/index');
    }

    /**
     * Página de calificaciones con las evaluaciones y la definitiva de cada
     * materia.
     */
    public function calificaciones(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/calificaciones/index');
    }

    /**
     * Página de docentes que imparten clase al estudiante.
     */
    public function profesores(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/profesores/index');
    }

    /**
     * Página del mapa curricular de la carrera.
     */
    public function pensum(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/pensum/index');
    }

    /**
     * Página del horario oficial del estudiante.
     */
    public function horario(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/horario/index');
    }

    /**
     * Página del expediente personal del estudiante.
     */
    public function perfil(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/perfil/index');
    }

    /**
     * Página de trámites y constancias del estudiante.
     */
    public function tramites(Request $request): Response|RedirectResponse
    {
        return $this->renderPage($request, 'student/tramites/index');
    }

    /**
     * Renderiza una página del portal con los datos del estudiante autenticado.
     */
    private function renderPage(Request $request, string $page): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null || ! $user->isStudent()) {
            return redirect()->route('login');
        }

        return Inertia::render($page, $this->pageData($user));
    }

    /**
     * Datos compartidos por las páginas del portal del estudiante.
     *
     * @return array<string, mixed>
     */
    private function pageData(User $user): array
    {
        $profile = $user->studentProfile()->with('career')->first();

        $admission = Admission::query()
            ->with([
                'career',
                'documents' => static fn ($query) => $query->orderBy('type'),
                'statusHistories.changedBy',
            ])
            ->where('converted_user_id', $user->id)
            ->latest()
            ->first();

        $enrollments = Enrollment::query()
            ->with(['subject.career', 'academicPeriod', 'professor'])
            ->where('student_id', $user->id)
            ->orderByDesc('academic_period_id')
            ->orderBy('subject_id')
            ->get();

        // Definitiva, evaluaciones y condición de cada materia según las notas
        // que el docente cargó en el plan de evaluación.
        $gradeRows = StudentGrades::breakdown($enrollments);

        // Veces reprobada cada materia: sustenta el registro de repitencia en
        // Mis Materias y la suspensión de inscripciones a la tercera vez.
        $failedAttempts = $enrollments
            ->filter(static fn (Enrollment $enrollment): bool => ($gradeRows[$enrollment->id]['condition'] ?? $enrollment->status) === 'reprobado')
            ->countBy(static fn (Enrollment $enrollment): string => (string) ($enrollment->subject?->code ?? ''));

        $approvedEnrollments = $enrollments->filter(
            static fn (Enrollment $enrollment): bool => ($gradeRows[$enrollment->id]['condition'] ?? null) === 'aprobado',
        );
        $pendingCount = $enrollments->filter(
            static fn (Enrollment $enrollment): bool => in_array(
                $gradeRows[$enrollment->id]['condition'] ?? null,
                ['cursando', 'faltan_notas', 'plan_incompleto'],
                true,
            ),
        )->count();

        $grades = collect($gradeRows)
            ->pluck('definitive')
            ->filter(static fn (?float $definitive): bool => $definitive !== null);
        $average = $grades->isEmpty() ? null : $grades->avg();

        $totalCredits = $enrollments->sum(
            static fn (Enrollment $enrollment): int => $enrollment->subject->credits,
        );

        $approvedCredits = $approvedEnrollments->sum(
            static fn (Enrollment $enrollment): int => $enrollment->subject->credits,
        );

        // Horario de actividades presenciales según el horario elegido
        $schedule = StudentSchedule::forStudent(
            $profile?->career?->code,
            $profile !== null ? $profile->current_semester : 1,
            $admission?->schedule,
            $admission?->modality,
        );

        // Materias de libre elección que el estudiante ya tiene en su horario
        $scheduledSubjects = collect(data_get($schedule, 'subjects', []))
            ->filter(static fn (mixed $subject): bool => is_array($subject) && isset($subject['name']))
            ->values();

        $normalize = static fn (string $value): string => Str::lower(Str::ascii($value));

        $scheduledCodes = $scheduledSubjects->pluck('code')->filter()->all();
        $scheduledNames = $scheduledSubjects
            ->map(static fn (array $subject): string => $normalize((string) $subject['name']))
            ->filter()
            ->values()
            ->all();

        // Ofertas UNCLE que cubren un bloque: las inscritas o las incluidas en
        // el horario del período que cursa el estudiante.
        $offeredElectives = collect();

        if ($profile && $profile->career_id) {
            $offeredElectives = Subject::query()
                ->where('career_id', $profile->career_id)
                ->where('is_elective_slot', false)
                ->orderBy('name')
                ->get()
                ->filter(static fn (Subject $subject): bool => $subject->isElective())
                ->values();
        }

        $assignedElectives = $offeredElectives->filter(
            static function (Subject $subject) use ($enrollments, $scheduledCodes, $scheduledNames, $normalize): bool {
                if ($enrollments->contains('subject_id', $subject->id)) {
                    return true;
                }

                if (in_array($subject->code, $scheduledCodes, true)) {
                    return true;
                }

                $name = $normalize($subject->name);

                foreach ($scheduledNames as $scheduledName) {
                    similar_text($name, $scheduledName, $percent);

                    if ($percent >= 85.0) {
                        return true;
                    }
                }

                return false;
            },
        )->values();

        // Pénsum / Mapa curricular de la carrera
        $pensum = [];
        if ($profile && $profile->career_id) {
            $careerSubjects = Subject::query()
                ->where('career_id', $profile->career_id)
                ->pensumBase()
                ->orderBy('semester')
                ->orderBy('name')
                ->get()
                ->groupBy('semester');

            $availableElectives = $assignedElectives;

            foreach ($careerSubjects as $semester => $subjects) {
                $pensum[] = [
                    'semester' => (int) $semester,
                    'subjects' => $subjects->map(function (Subject $subject) use (&$availableElectives, $enrollments, $gradeRows): array {
                        $isElective = $subject->isElective();
                        $assigned = null;

                        if ($subject->isElectiveSlot()) {
                            $key = $availableElectives->search(
                                static fn (Subject $candidate): bool => (int) $candidate->semester === (int) $subject->semester
                                    && (string) $candidate->component === (string) $subject->component,
                            );

                            if ($key !== false) {
                                $assigned = $availableElectives->pull($key);
                            }
                        }

                        $enrolled = $enrollments->firstWhere('subject_id', $assigned?->id ?? $subject->id);
                        $isAssigned = $assigned !== null;
                        $status = $isAssigned ? 'cursando' : 'pendiente';
                        $grade = null;

                        if ($enrolled) {
                            $gradeRow = $gradeRows[$enrolled->id] ?? null;
                            $condition = $gradeRow['condition'] ?? $enrolled->status;

                            $grade = $gradeRow['definitive']
                                ?? ($enrolled->final_grade !== null ? (float) $enrolled->final_grade : null);

                            $status = match ($condition) {
                                'aprobado' => 'aprobado',
                                'reprobado' => 'reprobado',
                                'retirado' => 'pendiente',
                                default => 'cursando',
                            };
                        }

                        return [
                            'id' => $subject->id,
                            'name' => $assigned?->name ?? ($isElective ? $subject->electiveLabel() : $subject->name),
                            'code' => $assigned?->code ?? ($isElective ? SubjectCode::ELECTIVE_TYPE : $subject->code),
                            'semester' => (int) $subject->semester,
                            'credits' => (int) ($assigned?->credits ?? $subject->credits),
                            'type' => $subject->type,
                            'is_elective' => $isElective,
                            'is_assigned' => $isElective && $isAssigned,
                            'status' => $status,
                            'grade' => $grade,
                        ];
                    })->values(),
                ];
            }
        }

        // Duración del pénsum en periodos (años = periodos / 2)
        $durationSemesters = $profile?->career?->duration_semesters ?: count($pensum);

        // Trámites de ejemplo del estudiante
        $tramites = session()->get('student_tramites', [
            [
                'id' => 1,
                'type' => 'constancia_estudios',
                'type_label' => 'Constancia de Estudios',
                'status' => 'aprobado',
                'status_label' => 'Aprobado',
                'status_tone' => 'green',
                'created_at' => now()->subDays(3)->format('d/m/Y'),
            ],
            [
                'id' => 2,
                'type' => 'constancia_notas',
                'type_label' => 'Récord Académico / Notas',
                'status' => 'pendiente',
                'status_label' => 'En proceso',
                'status_tone' => 'amber',
                'created_at' => now()->subDay()->format('d/m/Y'),
            ],
        ]);

        // Materias del período: las del horario publicado, cruzadas con la
        // inscripción del estudiante para reflejar notas y estado.
        $activePeriodName = AcademicPeriod::query()->where('is_active', true)->value('name') ?? '2026-II';

        // El cohorte del horario identifica el período académico que se cursa.
        $schedulePeriodName = is_string($schedule['cohort'] ?? null) && $schedule['cohort'] !== ''
            ? $schedule['cohort']
            : $activePeriodName;

        $scheduleSubjects = collect(is_array($schedule['subjects'] ?? null) ? $schedule['subjects'] : [])
            ->merge(is_array($schedule['distance_subjects'] ?? null) ? $schedule['distance_subjects'] : [])
            ->filter(static fn (mixed $subject): bool => is_array($subject) && isset($subject['code']))
            ->unique('code')
            ->values();

        $subjectCatalog = $scheduleSubjects->isEmpty()
            ? collect()
            : Subject::query()
                ->with('career:id,name,code')
                ->whereIn('code', $scheduleSubjects->pluck('code')->all())
                ->get()
                ->keyBy('code');

        $presentSubject = static function (array $subject, int $index, ?string $period = null) use ($enrollments, $gradeRows, $subjectCatalog, $profile, $activePeriodName, $failedAttempts): array {
            $catalog = $subjectCatalog->get($subject['code']);
            $enrollment = $enrollments->first(
                static fn (Enrollment $candidate): bool => $candidate->subject?->code === $subject['code'],
            );

            $professorId = isset($subject['professor_id'])
                ? (int) $subject['professor_id']
                : $enrollment?->professor_id;
            $teacher = trim((string) ($subject['teacher'] ?? ''));
            $professorName = $teacher !== '' ? $teacher : $enrollment?->professor?->name;
            $grade = $enrollment?->final_grade !== null ? (float) $enrollment->final_grade : null;
            $gradeRow = $enrollment !== null ? ($gradeRows[$enrollment->id] ?? null) : null;

            return [
                'id' => $enrollment?->id ?? $catalog?->id ?? $index + 1,
                'subject' => $subject['name'] ?? $catalog?->name,
                'code' => (string) $subject['code'],
                'semester' => $catalog?->semester ?? $profile?->current_semester,
                'credits' => $catalog?->credits,
                'career' => $catalog?->career?->name ?? $profile?->career?->name,
                'period' => $enrollment?->academicPeriod?->name ?? $period ?? $activePeriodName,
                'professor' => $professorName,
                'professor_id' => $professorId,
                'professor_url' => $professorId !== null
                    ? route('student.professors.show', $professorId, absolute: false)
                    : null,
                'grade' => $gradeRow['definitive'] ?? $grade,
                'status' => $gradeRow['condition'] ?? $enrollment?->status ?? 'cursando',
                'status_label' => $gradeRow['condition_label'] ?? $enrollment?->statusLabel() ?? 'Cursando',
                'status_tone' => $gradeRow['condition_tone'] ?? $enrollment?->statusTone() ?? 'amber',
                'modality' => $catalog?->modalityLabel(),
                'attempts' => (int) ($failedAttempts[(string) $subject['code']] ?? 0),
            ];
        };

        $subjects = $scheduleSubjects
            ->map(static fn (array $subject, int $index): array => $presentSubject($subject, $index, $schedulePeriodName))
            ->concat(
                $enrollments
                    ->reject(static fn (Enrollment $enrollment): bool => $scheduleSubjects->contains(
                        'code',
                        $enrollment->subject?->code,
                    ))
                    ->values()
                    ->map(static function (Enrollment $enrollment, int $index) use ($presentSubject): array {
                        return $presentSubject([
                            'code' => $enrollment->subject?->code,
                            'name' => $enrollment->subject?->name,
                            'teacher' => $enrollment->professor?->name,
                            'professor_id' => $enrollment->professor_id,
                        ], $index);
                    }),
            )
            ->values();

        // Docentes que imparten esas materias, para agruparlos por período.
        $professorIds = $subjects
            ->pluck('professor_id')
            ->filter()
            ->unique()
            ->values();

        $professors = $professorIds->isEmpty()
            ? collect()
            : User::query()
                ->with('professorProfile')
                ->whereIn('id', $professorIds->all())
                ->get()
                ->keyBy('id');

        // Un docente puede dictar en más de un período: se agrupa por ambos.
        $teachers = $subjects
            ->filter(static fn (array $subject): bool => $subject['professor_id'] !== null)
            ->groupBy(static fn (array $subject): string => $subject['professor_id'].'|'.$subject['period'])
            ->map(static function (Collection $rows) use ($professors, $activePeriodName): ?array {
                $professor = $professors->get((int) $rows->first()['professor_id']);

                if ($professor === null) {
                    return null;
                }

                $professorProfile = $professor->professorProfile;

                return [
                    'id' => $professor->id,
                    'name' => $professor->name,
                    'email' => $professor->email,
                    'department' => data_get($professorProfile, 'department') ?? 'Academia UPEL',
                    'academic_title' => data_get($professorProfile, 'academic_title') ?? 'Profesor',
                    'subjects' => $rows->pluck('subject')->filter()->unique()->values()->all(),
                    'semesters' => $rows->pluck('semester')->filter()->unique()->sort()->values()->all(),
                    'period' => $rows->pluck('period')->filter()->first() ?? $activePeriodName,
                    'profile_url' => route('student.professors.show', $professor->id, absolute: false),
                ];
            })
            ->filter()
            ->values();

        // Actividad reciente: notas publicadas por el docente, horario
        // publicado y movimientos de la solicitud de admisión.
        $activity = collect();

        foreach ($enrollments as $enrollment) {
            $gradeRow = $gradeRows[$enrollment->id] ?? null;

            if ($gradeRow === null || $gradeRow['graded_at'] === null) {
                continue;
            }

            $activity->push([
                'id' => 'grades-'.$enrollment->id,
                'title' => 'Notas de '.($enrollment->subject?->name ?? 'la materia').' publicadas',
                'detail' => $gradeRow['graded_count'].' de '.$gradeRow['items_count'].' evaluaciones calificadas',
                'date' => $gradeRow['graded_at'],
                'tone' => 'green',
            ]);
        }

        $scheduleNotifications = $user->notifications()
            ->where('type', SchedulePublishedNotification::class)
            ->latest()
            ->take(2)
            ->get();

        foreach ($scheduleNotifications as $notification) {
            $activity->push([
                'id' => 'notification-'.$notification->id,
                'title' => (string) data_get($notification->data, 'title', 'Horario de clases'),
                'detail' => (string) data_get($notification->data, 'message', 'Se ha publicado tu horario de clases.'),
                'date' => $notification->created_at,
                'tone' => 'blue',
            ]);
        }

        if ($admission !== null) {
            foreach ($admission->statusHistories->sortByDesc('created_at')->take(2) as $history) {
                $isDocumentReview = $history->from_status === $history->to_status && $history->note !== null;

                $activity->push([
                    'id' => 'admission-'.$history->id,
                    'title' => $isDocumentReview
                        ? (string) $history->note
                        : 'Solicitud de admisión: '.$history->toLabel(),
                    'detail' => 'Movimiento del '.$history->created_at?->format('d/m/Y'),
                    'date' => $history->created_at,
                    'tone' => $history->toTone(),
                ]);
            }
        }

        $recentActivity = $activity
            ->filter(static fn (array $item): bool => $item['date'] !== null)
            ->sortByDesc(static fn (array $item): int => $item['date']->getTimestamp())
            ->take(5)
            ->map(static fn (array $item): array => [
                'id' => $item['id'],
                'title' => $item['title'],
                'detail' => $item['detail'],
                'date' => $item['date']->format('d/m/Y'),
                'when' => self::humanDate($item['date']),
                'tone' => $item['tone'],
            ])
            ->values();

        // Próximas evaluaciones del plan que el estudiante todavía no tiene
        // calificadas.
        $upcomingEvaluations = $enrollments
            ->flatMap(static fn (Enrollment $enrollment): array => collect($gradeRows[$enrollment->id]['upcoming'] ?? [])
                ->map(static fn (array $item): array => [
                    'id' => $enrollment->id.'|'.$item['date'].'|'.$item['title'],
                    'title' => $item['title'],
                    'subject' => $enrollment->subject?->name,
                    'code' => $enrollment->subject?->code,
                    'date' => $item['date'],
                    'scheduled_on' => $item['scheduled_on'],
                ])
                ->all())
            ->sortBy('date')
            ->take(4)
            ->values();

        return [
            'profile' => $profile !== null ? [
                'id' => $profile->id,
                'student_code' => $profile->student_code,
                'career' => $profile->career?->name,
                'career_code' => $profile->career?->code,
                'modality' => $admission?->modalityLabel() ?? $profile->career?->modalityLabel(),
                'duration_semesters' => $durationSemesters,
                'current_semester' => (int) $profile->current_semester,
                'status' => $profile->status,
                'status_label' => $profile->statusLabel(),
                'status_tone' => $profile->statusTone(),
                'admission_year' => $profile->admission_year,
                'graduation_year' => $profile->graduation_year,
                'phone' => $profile->phone ?? $admission?->phone,
                'personal_email' => $profile->personal_email ?? ($admission !== null ? $admission->email : $user->email),
                'address' => $profile->address ?? $admission?->address,
                'birth_date' => ($profile->birth_date ?? $admission?->birth_date)?->format('d/m/Y'),
                'birth_place' => $profile->birth_place,
                'emergency_contact' => $profile->emergency_contact,
                'shift' => $profile->shift ?? $admission?->shiftLabel(),
                'advisor' => $profile->advisor,
                'id_number' => $admission?->formattedIdNumber(),
                'nationality' => $admission?->nationalityLabel(),
                'gender' => $admission?->genderLabel(),
                'period_year' => $admission !== null ? $admission->period_year : $profile->admission_year,
                'admission_code' => $admission?->code,
            ] : null,
            'admission' => $admission !== null ? $this->admissionData($admission) : null,
            'document_types' => AdmissionDocumentType::options(),
            'documents_upload_url' => route('student.documents.store', absolute: false),
            'photo_url' => $admission?->documents->contains(
                static fn (AdmissionDocument $document): bool => $document->type === AdmissionDocumentType::Foto->value,
            ) === true
                ? route('student.photo', absolute: false)
                : null,
            'summary' => [
                'average' => $average !== null ? round((float) $average, 1) : null,
                'subjects_count' => $enrollments->count(),
                'approved_count' => $approvedEnrollments->count(),
                'pending_count' => $pendingCount,
                'credits_total' => $totalCredits,
                'credits_approved' => $approvedCredits,
                'progress' => $totalCredits > 0
                    ? (int) round(($approvedCredits / $totalCredits) * 100)
                    : 0,
            ],
            'recent_activity' => $recentActivity,
            'upcoming_evaluations' => $upcomingEvaluations,
            'enrollments' => $enrollments->map(
                static function (Enrollment $enrollment) use ($gradeRows): array {
                    $gradeRow = $gradeRows[$enrollment->id] ?? null;
                    $finalGrade = $enrollment->final_grade !== null ? (float) $enrollment->final_grade : null;

                    return [
                        'id' => $enrollment->id,
                        'subject' => $enrollment->subject?->name,
                        'code' => $enrollment->subject?->code,
                        'semester' => $enrollment->subject?->semester,
                        'credits' => $enrollment->subject?->credits,
                        'career' => $enrollment->subject?->career?->name,
                        'period' => $enrollment->academicPeriod?->name,
                        'professor' => $enrollment->professor?->name,
                        'definitive' => $gradeRow['definitive'] ?? $finalGrade,
                        'status' => $gradeRow['condition'] ?? $enrollment->status,
                        'status_label' => $gradeRow['condition_label'] ?? $enrollment->statusLabel(),
                        'status_tone' => $gradeRow['condition_tone'] ?? $enrollment->statusTone(),
                        'graded_count' => $gradeRow['graded_count'] ?? 0,
                        'items_count' => $gradeRow['items_count'] ?? 0,
                        'evaluations' => $gradeRow['evaluations'] ?? [],
                        'modality' => $enrollment->subject?->modalityLabel() ?? 'Online',
                    ];
                },
            )->values(),
            'subjects' => $subjects,
            'teachers' => $teachers,
            'pensum' => $pensum,
            'schedule' => $schedule,
            'tramites' => $tramites,
            'active_period' => $activePeriodName,
        ];
    }

    /**
     * Describe una fecha en español para la línea de tiempo.
     */
    private static function humanDate(CarbonInterface $date): string
    {
        $minutes = (int) now()->diffInMinutes($date);

        if ($minutes < 1) {
            return 'Ahora mismo';
        }

        if ($minutes < 60) {
            return $minutes === 1 ? 'Hace 1 minuto' : "Hace {$minutes} minutos";
        }

        $hours = intdiv($minutes, 60);

        if ($hours < 24) {
            return $hours === 1 ? 'Hace 1 hora' : "Hace {$hours} horas";
        }

        $days = intdiv($hours, 24);

        if ($days === 1) {
            return 'Ayer';
        }

        return "Hace {$days} días";
    }

    /**
     * Información del expediente de admisión disponible para el estudiante.
     *
     * @return array<string, mixed>
     */
    private function admissionData(Admission $admission): array
    {
        return [
            'code' => $admission->code,
            'status' => $admission->status,
            'status_label' => $admission->statusEnum() === AdmissionStatus::Convertida
                ? 'Estudiante'
                : $admission->statusLabel(),
            'status_tone' => $admission->statusTone(),
            'submitted_at' => $admission->submitted_at?->format('d/m/Y h:i A'),
            'reviewed_at' => $admission->reviewed_at?->format('d/m/Y h:i A'),
            'converted_at' => $admission->converted_at?->format('d/m/Y h:i A'),
            'period_year' => $admission->period_year,
            'career' => $admission->career?->name,
            'career_code' => $admission->career?->code,
            'modality' => $admission->modalityLabel(),
            'schedule' => $admission->scheduleLabel(),
            'shift' => $admission->shiftLabel(),
            'full_name' => $admission->fullName(),
            'first_name' => $admission->first_name,
            'last_name' => $admission->last_name,
            'nationality' => $admission->nationalityLabel(),
            'id_number' => $admission->id_number,
            'formatted_id_number' => $admission->formattedIdNumber(),
            'birth_date' => $admission->birth_date->format('d/m/Y'),
            'age' => $admission->age(),
            'gender' => $admission->genderLabel(),
            'email' => $admission->email,
            'phone' => $admission->phone,
            'address' => $admission->address,
            'high_school' => $admission->high_school,
            'high_school_year' => $admission->high_school_year,
            'high_school_average' => number_format((float) $admission->high_school_average, 2, ',', '.'),
            'review_notes' => $admission->review_notes,
            'tracking_url' => $admission->trackingUrl(),
            'documents' => $admission->documents->map(
                static fn (AdmissionDocument $document): array => [
                    'id' => $document->id,
                    'type' => $document->type,
                    'type_label' => $document->typeLabel(),
                    'status' => $document->status,
                    'status_label' => $document->statusLabel(),
                    'status_tone' => $document->statusTone(),
                    'original_name' => $document->original_name,
                    'size' => $document->humanSize(),
                    'notes' => $document->notes,
                    'uploaded_at' => $document->created_at?->format('d/m/Y'),
                    'is_previewable' => $document->isPreviewable(),
                    'preview_url' => route('student.documents.preview', ['document' => $document->id], absolute: false),
                    'download_url' => route('student.documents.download', ['document' => $document->id], absolute: false),
                ],
            )->values(),
            'history' => AdmissionTimeline::present($admission->statusHistories),
        ];
    }

    /**
     * Actualiza el perfil exclusivo del estudiante autenticado.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null || ! $user->isStudent()) {
            return redirect()->route('login');
        }

        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'personal_email' => ['required', 'email', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = $user->studentProfile()->first();
        if ($profile) {
            $profile->update([
                'phone' => $validated['phone'],
                'personal_email' => $validated['personal_email'],
                'address' => $validated['address'],
                'birth_place' => $validated['birth_place'] ?? null,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
            ]);
        }

        return back()->with('success', '¡Perfil actualizado correctamente!');
    }
}
