<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\EvaluationPlanGrading;
use App\Support\ProfessorWorkspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Páginas independientes del portal docente.
 *
 * Cada sección del menú abre su propia página: resumen, estudiantes con la
 * nota final del expediente, carga de notas por evaluación y carreras.
 */
class ProfessorWorkspaceController extends Controller
{
    /**
     * Página "Estudiantes": nota final del expediente por materia.
     */
    public function students(Request $request): Response
    {
        $data = ProfessorWorkspace::overview($this->professor($request));

        return Inertia::render('dashboard/professor/students', [
            'careers' => $data['careers'],
            'summary' => $data['summary'],
            'active_period' => $data['active_period'],
        ]);
    }

    /**
     * Página "Cargar notas": planilla de notas por evaluación de cada materia.
     */
    public function grades(Request $request): Response
    {
        $data = ProfessorWorkspace::overview($this->professor($request), true);

        return Inertia::render('dashboard/professor/grades', [
            'careers' => $data['careers'],
            'active_period' => $data['active_period'],
            'focus' => $this->focus($data['careers'], $request),
            'limits' => EvaluationPlanGrading::limits(),
        ]);
    }

    /**
     * Página "Mis carreras": carreras y materias asignadas por los horarios.
     */
    public function careers(Request $request): Response
    {
        $data = ProfessorWorkspace::overview($this->professor($request));

        return Inertia::render('dashboard/professor/careers', [
            'careers' => $data['careers'],
            'summary' => $data['summary'],
            'active_period' => $data['active_period'],
            'limits' => EvaluationPlanGrading::limits(),
        ]);
    }

    /**
     * Docente autenticado que consulta su propio panel.
     */
    private function professor(Request $request): User
    {
        $professor = $request->user();

        abort_if($professor === null, 403);

        return $professor;
    }

    /**
     * Materia y estudiante a los que apunta un enlace desde otra página.
     *
     * @param  array<int, array<string, mixed>>  $careers
     * @return array{career_id: int, subject_id: int, student_id: int|null}|null
     */
    private function focus(array $careers, Request $request): ?array
    {
        $subjectId = $request->integer('materia');
        $studentId = $request->integer('estudiante');

        if ($subjectId <= 0) {
            return null;
        }

        foreach ($careers as $career) {
            foreach ($career['subjects'] as $subject) {
                if ($subject['id'] === $subjectId) {
                    return [
                        'career_id' => $career['id'],
                        'subject_id' => $subjectId,
                        'student_id' => $studentId > 0 ? $studentId : null,
                    ];
                }
            }
        }

        return null;
    }
}
