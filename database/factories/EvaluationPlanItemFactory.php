<?php

namespace Database\Factories;

use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvaluationPlanItem>
 */
class EvaluationPlanItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evaluation_plan_id' => EvaluationPlan::factory(),
            'position' => 1,
            'title' => fake()->randomElement([
                'Taller',
                'Prueba escrita',
                'Exposición',
                'Informe de lectura',
                'Trabajo práctico',
            ]),
            'content' => fake()->sentence(10),
            'weight' => 10,
            'scheduled_on' => now()->addWeek()->toDateString(),
        ];
    }
}
