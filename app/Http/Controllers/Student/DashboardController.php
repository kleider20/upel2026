<?php

namespace App\Http\Controllers\Student;

use App\Enums\AdmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;
use App\Support\StudentSchedule;
use App\Support\SubjectCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard completo y exclusivo del estudiante autenticado.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null || ! $user->isStudent()) {
            return redirect()->route('login');
        }

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

        $graded = $enrollments->whereNotNull('final_grade');
        $approved = $enrollments->where('status', 'aprobado');
        $average = $graded->avg('final_grade');

        $totalCredits = $enrollments->sum(
            static fn (Enrollment $enrollment): int => $enrollment->subject->credits,
        );

        $approvedCredits = $approved->sum(
            static fn (Enrollment $enrollment): int => $enrollment->subject->credits,
        );

        // Profesores de las materias del estudiante
        $teachers = $enrollments->pluck('professor')
            ->filter()
            ->unique('id')
            ->map(static function (User $professor) use ($enrollments) {
                $professorSubjects = $enrollments->where('professor_id', $professor->id)
                    ->pluck('subject.name')
                    ->filter()
                    ->unique()
                    ->values();

                $profProfile = $professor->professorProfile()->first();

                return [
                    'id' => $professor->id,
                    'name' => $professor->name,
                    'email' => $professor->email,
                    'department' => data_get($profProfile, 'department') ?? 'Academia UPEL',
                    'academic_title' => data_get($profProfile, 'academic_title') ?? 'Profesor',
                    'subjects' => $professorSubjects,
                ];
            })->values();

        // Pénsum / Mapa curricular de la carrera
        $pensum = [];
        if ($profile && $profile->career_id) {
            $careerSubjects = Subject::query()
                ->where('career_id', $profile->career_id)
                ->orderBy('semester')
                ->orderBy('name')
                ->get()
                ->groupBy('semester');

            foreach ($careerSubjects as $semester => $subjects) {
                $pensum[] = [
                    'semester' => (int) $semester,
                    'subjects' => $subjects->map(function (Subject $subject) use ($enrollments) {
                        $enrolled = $enrollments->firstWhere('subject_id', $subject->id);
                        $status = 'pendiente';
                        $grade = null;

                        if ($enrolled) {
                            $grade = $enrolled->final_grade !== null ? (float) $enrolled->final_grade : null;
                            $status = $enrolled->status === 'aprobado' ? 'aprobado' : ($enrolled->status === 'reprobado' ? 'reprobado' : 'cursando');
                        }

                        return [
                            'id' => $subject->id,
                            'name' => $subject->name,
                            'code' => $subject->code,
                            'semester' => (int) $subject->semester,
                            'credits' => (int) $subject->credits,
                            'type' => $subject->type,
                            'is_elective' => strtoupper(trim((string) $subject->type)) === SubjectCode::ELECTIVE_TYPE,
                            'status' => $status,
                            'grade' => $grade,
                        ];
                    })->values(),
                ];
            }
        }

        // Duración del pénsum en periodos (años = periodos / 2)
        $durationSemesters = $profile?->career?->duration_semesters ?: count($pensum);

        // Horario de actividades presenciales según el horario elegido
        $schedule = StudentSchedule::forStudent(
            $profile?->career?->code,
            $profile !== null ? $profile->current_semester : 1,
            $admission?->schedule,
            $admission?->modality,
        );

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

        return Inertia::render('Student/Dashboard/Index', [
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
                'nationality' => $admission?->nationality,
                'period_year' => $admission !== null ? $admission->period_year : $profile->admission_year,
                'admission_code' => $admission?->code,
            ] : null,
            'admission' => $admission !== null ? $this->admissionData($admission) : null,
            'summary' => [
                'average' => $average !== null ? round((float) $average, 1) : null,
                'subjects_count' => $enrollments->count(),
                'approved_count' => $approved->count(),
                'pending_count' => $enrollments->where('status', 'cursando')->count(),
                'credits_total' => $totalCredits,
                'credits_approved' => $approvedCredits,
                'progress' => $totalCredits > 0
                    ? (int) round(($approvedCredits / $totalCredits) * 100)
                    : 0,
            ],
            'enrollments' => $enrollments->map(
                static function (Enrollment $enrollment): array {
                    $baseGrade = $enrollment->final_grade !== null ? (float) $enrollment->final_grade : null;
                    // Generar cortes simulados razonables si hay nota final
                    $n1 = $baseGrade !== null ? min(20, max(1, round($baseGrade * (0.9 + (rand(0, 20) / 100)), 1))) : null;
                    $n2 = $baseGrade !== null ? min(20, max(1, round($baseGrade * (0.95 + (rand(0, 10) / 100)), 1))) : null;
                    $n3 = $baseGrade !== null ? min(20, max(1, round($baseGrade * (0.98 + (rand(0, 10) / 100)), 1))) : null;

                    return [
                        'id' => $enrollment->id,
                        'subject' => $enrollment->subject?->name,
                        'code' => $enrollment->subject?->code,
                        'semester' => $enrollment->subject?->semester,
                        'credits' => $enrollment->subject?->credits,
                        'career' => $enrollment->subject?->career?->name,
                        'period' => $enrollment->academicPeriod?->name,
                        'professor' => $enrollment->professor?->name,
                        'n1' => $n1,
                        'n2' => $n2,
                        'n3' => $n3,
                        'final' => $baseGrade,
                        'grade' => $baseGrade,
                        'status' => $enrollment->status,
                        'status_label' => $enrollment->statusLabel(),
                        'status_tone' => $enrollment->statusTone(),
                        'modality' => 'Online',
                    ];
                },
            )->values(),
            'teachers' => $teachers,
            'pensum' => $pensum,
            'schedule' => $schedule,
            'tramites' => $tramites,
            'active_period' => AcademicPeriod::query()->where('is_active', true)->value('name') ?? '2026-II',
        ]);
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
            'nationality' => $this->nationalityLabel($admission->nationality),
            'id_number' => $admission->id_number,
            'formatted_id_number' => $admission->formattedIdNumber(),
            'birth_date' => $admission->birth_date->format('d/m/Y'),
            'age' => $admission->age(),
            'gender' => $this->genderLabel($admission->gender),
            'email' => $admission->email,
            'phone' => $admission->phone,
            'address' => $admission->address,
            'high_school' => $admission->high_school,
            'high_school_year' => $admission->high_school_year,
            'high_school_average' => number_format((float) $admission->high_school_average, 2, ',', '.'),
            'review_notes' => $admission->review_notes,
            'tracking_url' => $admission->trackingUrl(),
            'documents' => $admission->documents->map(
                static fn ($document): array => [
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
                ],
            )->values(),
            'history' => $admission->statusHistories->map(
                static fn ($history): array => [
                    'id' => $history->id,
                    'from' => $history->fromLabel(),
                    'to' => $history->toLabel(),
                    'tone' => $history->toTone(),
                    'note' => $history->note,
                    'changed_by' => data_get($history->changedBy, 'name') ?? 'Sistema',
                    'date' => $history->created_at?->format('d/m/Y h:i A'),
                ],
            )->values(),
        ];
    }

    /**
     * Etiqueta legible de la nacionalidad de la cédula (V o E).
     */
    private function nationalityLabel(?string $nationality): ?string
    {
        return match ($nationality) {
            'V' => 'Venezolano',
            'E' => 'Extranjero',
            default => $nationality,
        };
    }

    /**
     * Etiqueta legible del género declarado en la solicitud.
     */
    private function genderLabel(?string $gender): ?string
    {
        return match ($gender) {
            'masculino' => 'Masculino',
            'femenino' => 'Femenino',
            'otro' => 'Otro',
            'prefiero_no_decir' => 'Prefiero no decir',
            default => null,
        };
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
            'emergency_contact' => ['required', 'string', 'max:255'],
        ]);

        $profile = $user->studentProfile()->first();
        if ($profile) {
            $profile->update([
                'phone' => $validated['phone'],
                'personal_email' => $validated['personal_email'],
                'address' => $validated['address'],
                'emergency_contact' => $validated['emergency_contact'],
            ]);
        }

        return back()->with('success', '¡Perfil actualizado correctamente!');
    }
}
