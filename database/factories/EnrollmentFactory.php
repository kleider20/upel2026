<?php

namespace Database\Factories;

use App\Models\AcademicPeriod;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'academic_period_id' => AcademicPeriod::factory(),
            'professor_id' => null,
            'status' => 'cursando',
            'final_grade' => null,
            'grade_updated_at' => null,
        ];
    }

    public function graded(float $grade = 8.5): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $grade >= Subject::PASSING_GRADE ? 'aprobado' : 'reprobado',
            'final_grade' => $grade,
            'grade_updated_at' => now(),
        ]);
    }
}
