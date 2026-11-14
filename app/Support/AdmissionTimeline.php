<?php

namespace App\Support;

use App\Models\AdmissionStatusHistory;
use Illuminate\Support\Collection;

class AdmissionTimeline
{
    /**
     * Estructura las entradas del historial para las vistas de Inertia.
     *
     * Las revisiones documentales se guardan sin cambio de estado; en esos
     * casos la nota pasa a ser el título para que la línea de tiempo resulte
     * legible.
     *
     * @param  Collection<int, AdmissionStatusHistory>  $histories
     * @return array<int, array{id: int, from: string, to: string, title: string, tone: string, note: string|null, changed_by: string, date: string|null}>
     */
    public static function present(Collection $histories): array
    {
        return $histories->map(static function (AdmissionStatusHistory $history): array {
            $isDocumentReview = $history->from_status === $history->to_status
                && $history->note !== null;

            return [
                'id' => $history->id,
                'from' => $history->fromLabel(),
                'to' => $history->toLabel(),
                'title' => $isDocumentReview ? $history->note : $history->toLabel(),
                'tone' => $history->toTone(),
                'note' => $isDocumentReview ? null : $history->note,
                'changed_by' => data_get($history->changedBy, 'name') ?? 'Sistema',
                'date' => $history->created_at?->format('d/m/Y h:i A'),
            ];
        })->values()->all();
    }
}
