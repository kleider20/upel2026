<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Subject;
use App\Models\User;
use App\Support\StudentSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentProfessorController extends Controller
{
    /**
     * Muestra el perfil del profesor asignado a una materia del estudiante.
     */
    public function show(Request $request, User $professor): Response
    {
        $student = $request->user();

        abort_unless($student instanceof User && $student->isStudent(), 403);
        abort_unless($professor->isProfessor(), 404);

        $profile = $student->studentProfile()->with('career')->first();

        $admission = Admission::query()
            ->where('converted_user_id', $student->id)
            ->latest()
            ->first();

        $schedule = StudentSchedule::forStudent(
            $profile?->career?->code,
            $profile !== null ? $profile->current_semester : 1,
            $admission?->schedule,
            $admission?->modality,
        );

        $assignedCodes = collect(is_array($schedule['subjects'] ?? null) ? $schedule['subjects'] : [])
            ->merge(is_array($schedule['distance_subjects'] ?? null) ? $schedule['distance_subjects'] : [])
            ->filter(static fn (mixed $subject): bool => is_array($subject))
            ->filter(static fn (array $subject): bool => isset($subject['professor_id'])
                && (int) $subject['professor_id'] === $professor->id)
            ->pluck('code')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $taught = $professor->taughtSubjects()
            ->with('career:id,name,code')
            ->orderBy('semester')
            ->orderBy('name')
            ->get();

        // Materias que el profesor dicta al estudiante: primero las que tiene
        // asignadas en su horario y, si el horario no registra docentes, las de
        // la carrera del estudiante.
        $subjects = $taught
            ->filter(static fn (Subject $subject): bool => in_array($subject->code, $assignedCodes, true))
            ->values();

        if ($subjects->isEmpty()) {
            $subjects = $taught
                ->filter(static fn (Subject $subject): bool => $profile?->career_id !== null
                    && $subject->career_id === $profile->career_id)
                ->values();
        }

        $professorProfile = $professor->professorProfile()->first();

        return Inertia::render('Student/Professor/Show', [
            'professor' => [
                'id' => $professor->id,
                'name' => $professor->name,
                'email' => $professor->email,
                'employee_code' => $professorProfile?->employee_code,
                'department' => $professorProfile?->department ?? 'Academia UPEL',
                'academic_title' => $professorProfile?->academic_title ?? 'Profesor',
                'assigned_in_schedule' => $assignedCodes !== [],
                'subjects' => $subjects
                    ->map(static fn (Subject $subject): array => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'semester' => (int) $subject->semester,
                        'credits' => (int) $subject->credits,
                        'modality' => $subject->modalityLabel(),
                        'career' => $subject->career?->name,
                    ])
                    ->values()
                    ->all(),
            ],
            'dashboard_url' => route('dashboard', absolute: false),
            'subjects_url' => route('dashboard', ['tab' => 'materias'], absolute: false),
        ]);
    }
}
