<?php

namespace Database\Factories;

use App\Models\AcademicPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AcademicPeriod>
 */
class AcademicPeriodFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = fake()->numberBetween(2024, 2027);
        $term = fake()->randomElement(['I', 'II']);

        return [
            'name' => "{$year}-{$term}",
            'starts_at' => "{$year}-01-15",
            'ends_at' => "{$year}-07-15",
            'is_active' => true,
        ];
    }
}
