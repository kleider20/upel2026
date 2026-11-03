<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->sentence(4),
            'type' => fake()->randomElement(array_keys(Program::typeLabels())),
            'description' => fake()->sentence(14),
            'duration' => fake()->randomElement(['12 meses', '18 meses', '24 meses']),
            'modality' => fake()->randomElement(['online', 'mixta', 'presencial']),
            'is_active' => true,
        ];
    }
}
