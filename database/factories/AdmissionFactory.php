<?php

namespace Database\Factories;

use App\Enums\AdmissionStatus;
use App\Models\Admission;
use App\Models\Career;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Admission>
 */
class AdmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $periodYear = (int) config('admissions.period_year');

        return [
            'code' => 'ASP-'.$periodYear.'-'.fake()->unique()->numerify('######'),
            'period_year' => $periodYear,
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'nationality' => 'V',
            'id_number' => fake()->unique()->numerify('########'),
            'birth_date' => fake()->dateTimeBetween('-35 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['masculino', 'femenino', 'otro', 'prefiero_no_decir']),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '04'.fake()->numerify('#########'),
            'address' => fake()->address(),
            'career_id' => Career::factory(),
            'modality' => fake()->randomElement(['presencial', 'mixta', 'online']),
            'schedule' => fake()->randomElement(['lunes_viernes', 'sabatino']),
            'shift' => fake()->randomElement(['diurno', 'nocturno']),
            'high_school' => 'Unidad Educativa '.fake()->lastName(),
            'high_school_year' => fake()->numberBetween(2018, (int) now()->format('Y')),
            'high_school_average' => fake()->randomFloat(2, 8, 20),
            'status' => AdmissionStatus::Recibida->value,
            'submitted_at' => now(),
        ];
    }

    /**
     * Solicitud aprobada, lista para convertirse en estudiante.
     */
    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status' => AdmissionStatus::Aprobada->value,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Solicitud observada por el equipo de admisión.
     */
    public function observed(): static
    {
        return $this->state(fn (): array => [
            'status' => AdmissionStatus::Observada->value,
            'review_notes' => 'Debes cargar las notas certificadas actualizadas.',
            'reviewed_at' => now(),
        ]);
    }
}
