<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => User::factory(),
            'concept' => fake()->randomElement([
                'Inscripción semestral',
                'Mensualidad',
                'Derecho de grado',
                'Certificado de notas',
            ]),
            'amount' => fake()->randomFloat(2, 20, 120),
            'status' => fake()->randomElement(['pendiente', 'pagado', 'vencido']),
            'due_date' => fake()->dateTimeBetween('-2 months', '+2 months'),
            'paid_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pagado',
            'paid_at' => now(),
        ]);
    }
}
