<?php

namespace Database\Factories;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdmissionDocument>
 */
class AdmissionDocumentFactory extends Factory
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
            'type' => fake()->randomElement(AdmissionDocumentType::cases())->value,
            'status' => AdmissionDocumentStatus::Pendiente->value,
            'original_name' => fake()->slug(2).'.pdf',
            'path' => 'admissions/demo/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(80_000, 1_500_000),
            'notes' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    /**
     * Documento validado por el equipo de admisión.
     */
    public function validated(): static
    {
        return $this->state(fn (): array => [
            'status' => AdmissionDocumentStatus::Validado->value,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Documento rechazado con su motivo.
     */
    public function rejected(): static
    {
        return $this->state(fn (): array => [
            'status' => AdmissionDocumentStatus::Rechazado->value,
            'notes' => 'El archivo está ilegible. Vuelve a cargarlo.',
            'reviewed_at' => now(),
        ]);
    }
}
