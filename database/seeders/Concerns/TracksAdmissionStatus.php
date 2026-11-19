<?php

namespace Database\Seeders\Concerns;

use App\Enums\AdmissionStatus;
use App\Models\Admission;

/**
 * Reconstruye el historial de estados de una solicitud de admisión de ejemplo.
 */
trait TracksAdmissionStatus
{
    /**
     * Historial mínimo de la solicitud: recepción y, si aplica, el estado actual.
     */
    protected function seedAdmissionHistory(Admission $admission, ?int $adminId): void
    {
        if ($admission->statusHistories()->exists()) {
            return;
        }

        $admission->statusHistories()->create([
            'from_status' => null,
            'to_status' => AdmissionStatus::Recibida->value,
            'note' => 'Solicitud recibida desde el formulario público.',
            'changed_by' => null,
        ]);

        if ($admission->status === AdmissionStatus::Recibida->value) {
            return;
        }

        $admission->statusHistories()->create([
            'from_status' => AdmissionStatus::Recibida->value,
            'to_status' => $admission->status,
            'note' => $admission->review_notes ?? 'Solicitud revisada por el equipo de admisión.',
            'changed_by' => $adminId,
        ]);
    }
}
