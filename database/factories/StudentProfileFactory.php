<?php

namespace Database\Factories;

use App\Models\Career;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'career_id' => Career::factory(),
            'student_code' => strtoupper(fake()->unique()->bothify('EST-####-###')),
            'current_semester' => fake()->numberBetween(1, 8),
            'status' => 'activo',
            'admission_year' => fake()->numberBetween(2018, 2025),
            'graduation_year' => null,
        ];
    }

    public function graduate(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'egresado',
            'graduation_year' => fake()->numberBetween(2018, 2025),
            'current_semester' => 8,
        ]);
    }
}
