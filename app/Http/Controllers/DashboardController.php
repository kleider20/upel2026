<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Program;
use App\Models\User;
use App\Support\ProfessorWorkspace;
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
     * Resumen del docente: carreras, materias y estudiantes a su cargo.
     *
     * La carga académica sale de los horarios publicados: si ninguna materia
     * lo tiene como titular, el panel queda "pendiente por asignación".
     */
    private function professorDashboard(User $user): Response
    {
        $data = ProfessorWorkspace::overview($user);

        return Inertia::render('dashboard/professor', [
            'profile' => $data['profile'],
            'summary' => $data['summary'],
            'careers' => $data['careers'],
            'active_period' => $data['active_period'],
        ]);
    }

    /**
     * Página de resumen del graduado.
     */
    public function graduateRecord(Request $request): Response|RedirectResponse
    {
        return $this->renderGraduatePage($request, 'graduate/record/index');
    }

    /**
     * Página con la oferta de formación continua del graduado.
     */
    public function graduatePrograms(Request $request): Response|RedirectResponse
    {
        return $this->renderGraduatePage($request, 'graduate/programs/index');
    }

    /**
     * Renderiza una página del portal del graduado.
     */
    private function renderGraduatePage(Request $request, string $page): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null || ! $user->isGraduate()) {
            return redirect()->route('login');
        }

        return Inertia::render($page, $this->graduateData($user));
    }

    /**
     * Panel del graduado: resumen, récord y formación continua.
     */
    private function graduateDashboard(User $user): Response
    {
        return Inertia::render('dashboard/graduate', $this->graduateData($user));
    }

    /**
     * Datos compartidos por las páginas del portal del graduado.
     *
     * @return array<string, mixed>
     */
    private function graduateData(User $user): array
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

        return [
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
        ];
    }
}
