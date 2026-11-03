<?php

namespace Database\Factories;

use App\Models\ProfessorProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProfessorProfile>
 */
class ProfessorProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_code' => strtoupper(fake()->unique()->bothify('PROF-####')),
            'department' => fake()->randomElement([
                'Pedagogía',
                'Lengua y Literatura',
                'Ciencias Sociales',
                'Educación Especial',
            ]),
            'academic_title' => fake()->randomElement([
                'Magíster en Educación',
                'Doctor en Educación',
                'Especialista en Didáctica',
            ]),
        ];
    }
}
