<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\EvaluationPlanItem;
use App\Models\EvaluationPlanScore;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvaluationPlanScore>
 */
class EvaluationPlanScoreFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evaluation_plan_item_id' => EvaluationPlanItem::factory(),
            'enrollment_id' => Enrollment::factory(),
            'score' => fake()->randomFloat(2, 1, 20),
        ];
    }
}
