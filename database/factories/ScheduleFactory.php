<?php

namespace Database\Factories;

use App\Models\Career;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Schedule>
 */
class ScheduleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'career_id' => Career::factory(),
            'period' => fake()->numberBetween(1, 8),
            'cohort' => fake()->numberBetween(2020, 2026).'-'.fake()->randomElement(['I', 'II']),
        ];
    }
}
