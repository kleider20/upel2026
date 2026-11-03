<?php

namespace Database\Factories;

use App\Models\HighSchool;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HighSchool>
 */
class HighSchoolFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Liceo '.fake()->unique()->lastName(),
        ];
    }
}
