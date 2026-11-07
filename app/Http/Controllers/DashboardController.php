<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Muestra el panel correspondiente al rol del usuario autenticado.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if ($user->isAdminPortalUser()) {
            return redirect()->route('admin.dashboard');
        }

        return match (true) {
            $user->isStudent() => $this->studentDashboard($user),
            $user->isProfessor() => $this->professorDashboard($user),
            $user->isGraduate() => $this->graduateDashboard($user),
            default => abort(403, 'Tu cuenta no tiene un rol asignado.'),
        };
    }

    /**
     * Panel del estudiante: resumen, materias, notas y promedio.
     */
    private function studentDashboard(User $user): Response|RedirectResponse
    {
        return (new Student\DashboardController)->index(request());
    }

    /**
     * Panel del profesor: carreras, materias y estudiantes para cargar notas.
     */
    private function professorDashboard(User $user): Response
    {
        $profile = $user->professorProfile()->first();

        $subjects = $user->taughtSubjects()
            ->with([
                'career',
                'enrollments' => static function ($query): void {
                    $query
                        ->with(['student.studentProfile', 'academicPeriod'])
                        ->orderBy('id');
                },
            ])
            ->orderBy('career_id')
            ->orderBy('semester')
            ->get();

        $careers = $subjects
            ->groupBy('career_id')
            ->map(
                /** @param Collection<int, Subject> $careerSubjects */
                static function (Collection $careerSubjects): array {
                    $career = $careerSubjects->first()->career;
                    $students = $careerSubjects
                        ->flatMap(static fn (Subject $subject) => $subject->enrollments->pluck('student'))
                        ->filter()
                        ->unique('id');

                    return [
                        'id' => $career->id,
                        'name' => $career->name,
                        'code' => $career->code,
                        'students_count' => $students->count(),
                        'subjects' => $careerSubjects->map(
                            static fn (Subject $subject): array => [
                                'id' => $subject->id,
                                'name' => $subject->name,
                                'code' => $subject->code,
                                'semester' => $subject->semester,
                                'students' => $subject->enrollments
                                    ->map(self::professorEnrollmentData(...))
                                    ->values(),
                            ],
                        )->values(),
                    ];
                },
            )
            ->values();

        $allEnrollments = $subjects->flatMap(
            static fn (Subject $subject) => $subject->enrollments,
        );
        $graded = $allEnrollments->whereNotNull('final_grade');
        $average = $graded->avg('final_grade');

        return Inertia::render('dashboard/professor', [
            'profile' => $profile !== null ? [
                'employee_code' => $profile->employee_code,
                'department' => $profile->department,
                'academic_title' => $profile->academic_title,
            ] : null,
            'summary' => [
                'careers_count' => $careers->count(),
                'subjects_count' => $subjects->count(),
                'students_count' => $careers->sum('students_count'),
                'pending_count' => $allEnrollments->whereNull('final_grade')->count(),
                'graded_count' => $graded->count(),
                'average' => $average !== null ? round((float) $average, 1) : null,
            ],
            'careers' => $careers,
            'active_period' => AcademicPeriod::query()->where('is_active', true)->value('name'),
        ]);
    }

    /**
     * @return array{
     *     enrollment_id: int,
     *     student_name: string,
     *     student_code: string|null,
     *     period: string,
     *     grade: float|null,
     *     status: string,
     *     status_label: string,
     *     status_tone: string
     * }
     */
    private static function professorEnrollmentData(Enrollment $enrollment): array
    {
        return [
            'enrollment_id' => $enrollment->id,
            'student_name' => $enrollment->student->name,
            'student_code' => $enrollment->student->studentProfile?->student_code,
            'period' => $enrollment->academicPeriod->name,
            'grade' => $enrollment->final_grade !== null
                ? (float) $enrollment->final_grade
                : null,
            'status' => $enrollment->status,
            'status_label' => $enrollment->statusLabel(),
            'status_tone' => $enrollment->statusTone(),
        ];
    }

    /**
     * Panel del graduado: récord académico, promedio y programas disponibles.
     */
    private function graduateDashboard(User $user): Response
    {
        $profile = $user->studentProfile()->with('career')->first();

        $enrollments = Enrollment::query()
            ->with(['subject.career', 'academicPeriod'])
            ->where('student_id', $user->id)
            ->whereNotNull('final_grade')
            ->orderByDesc('academic_period_id')
            ->orderBy('subject_id')
            ->get();

        $average = $enrollments->avg('final_grade');
        $totalCredits = $enrollments->sum(
            static fn (Enrollment $enrollment): int => $enrollment->subject->credits,
        );

        $programs = Program::query()
            ->where('is_active', true)
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->groupBy('type')
            ->map(static fn ($items, string $type): array => [
                'type' => $type,
                'label' => Program::typeLabels()[$type] ?? 'Programa',
                'items' => $items->map(
                    static fn (Program $program): array => [
                        'id' => $program->id,
                        'name' => $program->name,
                        'description' => $program->description,
                        'duration' => $program->duration,
                        'modality' => $program->modalityLabel(),
                    ],
                )->values(),
            ])
            ->values();

        return Inertia::render('dashboard/graduate', [
            'profile' => $profile !== null ? [
                'student_code' => $profile->student_code,
                'career' => $profile->career?->name,
                'career_code' => $profile->career?->code,
                'status' => $profile->status,
                'status_label' => $profile->statusLabel(),
                'status_tone' => $profile->statusTone(),
                'graduation_year' => $profile->graduation_year,
            ] : null,
            'summary' => [
                'average' => $average !== null ? round((float) $average, 1) : null,
                'subjects_count' => $enrollments->count(),
                'credits_total' => $totalCredits,
                'programs_count' => $programs->sum(
                    static fn (array $group): int => $group['items']->count(),
                ),
            ],
            'enrollments' => $enrollments->map(
                static fn (Enrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'subject' => $enrollment->subject?->name,
                    'code' => $enrollment->subject?->code,
                    'semester' => $enrollment->subject?->semester,
                    'credits' => $enrollment->subject?->credits,
                    'career' => $enrollment->subject?->career?->name,
                    'period' => $enrollment->academicPeriod?->name,
                    'grade' => $enrollment->final_grade !== null
                        ? (float) $enrollment->final_grade
                        : null,
                    'status' => $enrollment->status,
                    'status_label' => $enrollment->statusLabel(),
                    'status_tone' => $enrollment->statusTone(),
                ],
            )->values(),
            'programs' => $programs,
        ]);
    }
}
