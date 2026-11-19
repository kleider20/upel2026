<?php

namespace Database\Factories;

use App\Models\Classroom;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Classroom>
 */
class ClassroomFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('AULA-##')),
            'name' => fake()->randomElement(['Sala de clases', 'Laboratorio', 'Auditorio']).' '.fake()->unique()->numberBetween(1, 40),
            'capacity' => fake()->randomElement([20, 30, 40, 60]),
            'is_active' => true,
        ];
    }
}
