<?php

namespace Database\Seeders\Concerns;

use App\Models\AcademicPeriod;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;

/**
 * Registra inscripciones de estudiantes con el estado derivado de la nota final.
 */
trait ManagesEnrollments
{
    /**
     * Inscripción del estudiante en una materia y período.
     */
    protected function enrollStudent(
        User $student,
        Subject $subject,
        AcademicPeriod $period,
        ?User $professor = null,
        ?float $grade = null,
    ): Enrollment {
        $status = match (true) {
            $grade === null => 'cursando',
            $grade >= Subject::PASSING_GRADE => 'aprobado',
            default => 'reprobado',
        };

        return Enrollment::query()->updateOrCreate(
            [
                'student_id' => $student->id,
                'subject_id' => $subject->id,
                'academic_period_id' => $period->id,
            ],
            [
                'professor_id' => $professor?->id,
                'status' => $status,
                'final_grade' => $grade,
                'grade_updated_at' => $grade !== null ? now() : null,
            ],
        );
    }
}
