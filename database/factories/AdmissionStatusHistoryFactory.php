<?php

namespace Database\Factories;

use App\Enums\AdmissionStatus;
use App\Models\Admission;
use App\Models\AdmissionStatusHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdmissionStatusHistory>
 */
class AdmissionStatusHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'admission_id' => Admission::factory(),
            'from_status' => null,
            'to_status' => AdmissionStatus::Recibida->value,
            'note' => 'Solicitud recibida desde el formulario público.',
            'changed_by' => null,
        ];
    }
}
