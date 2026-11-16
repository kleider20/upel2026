<?php

namespace Database\Factories;

use App\Models\AcademicPeriod;
use App\Models\EvaluationPlan;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvaluationPlan>
 */
class EvaluationPlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'professor_id' => User::factory(),
            'schedule_id' => Schedule::factory(),
            'subject_id' => Subject::factory(),
            'academic_period_id' => AcademicPeriod::factory(),
            'modality' => 'presencial',
            'starts_on' => null,
            'ends_on' => null,
        ];
    }
}
