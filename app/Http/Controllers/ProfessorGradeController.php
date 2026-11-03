<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGradeRequest;
use App\Models\Enrollment;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;

class ProfessorGradeController extends Controller
{
    /**
     * Registra o actualiza la nota final de un estudiante.
     */
    public function update(UpdateGradeRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $professor = $request->user();

        $teachesSubject = $professor->taughtSubjects()
            ->whereKey($enrollment->subject_id)
            ->exists();

        if (! $teachesSubject) {
            abort(403, 'No tienes permiso para cargar notas en esta materia.');
        }

        $grade = round((float) $request->validated('final_grade'), 2);

        $enrollment->update([
            'professor_id' => $professor->id,
            'final_grade' => $grade,
            'status' => $grade >= Subject::PASSING_GRADE ? 'aprobado' : 'reprobado',
            'grade_updated_at' => now(),
        ]);

        return back()->with(
            'success',
            "Nota de {$enrollment->student?->name} actualizada correctamente.",
        );
    }
}
