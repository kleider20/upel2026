<?php

namespace Database\Factories;

use App\Models\Career;
use App\Models\CareerOffering;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CareerOffering>
 */
class CareerOfferingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'career_id' => Career::factory(),
            'modality' => fake()->randomElement(['presencial', 'online', 'mixta']),
            'schedule' => fake()->randomElement(['lunes_viernes', 'sabatino']),
            'shift' => fake()->randomElement(['diurno', 'nocturno']),
            'is_active' => true,
        ];
    }
}
