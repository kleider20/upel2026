<?php

namespace Database\Factories;

use App\Models\Career;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Career>
 */
class CareerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Educación Primaria',
                'Educación Especial',
                'Lengua y Literatura',
                'Geografía e Historia',
                'Educación Inicial',
                'Matemática y Física',
            ]).' '.fake()->unique()->numerify('###'),
            'code' => strtoupper(fake()->unique()->bothify('CAR-###')),
            'description' => fake()->sentence(12),
            'modality' => fake()->randomElement(['online', 'mixta', 'presencial']),
            'duration_semesters' => 8,
            'is_active' => true,
        ];
    }
}
