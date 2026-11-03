<?php

namespace Database\Factories;

use App\Models\Career;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'career_id' => Career::factory(),
            'code' => strtoupper(fake()->unique()->bothify('SUB-###')),
            'name' => fake()->unique()->sentence(4),
            'semester' => fake()->numberBetween(1, 8),
            'modality' => fake()->randomElement(['presencial', 'online', 'mixta']),
            'component' => fake()->randomElement(['CFPE', 'CFD', 'CFC', 'ECU']),
            'type' => fake()->randomElement(['UNCO', 'UNCLE']),
            'area' => null,
            'level' => null,
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 0,
            'prerequisites' => null,
            'is_active' => true,
        ];
    }
}
