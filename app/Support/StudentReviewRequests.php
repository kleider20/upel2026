<?php

namespace App\Support;

use App\Enums\AdmissionDocumentStatus;
use App\Models\AdmissionDocument;
use Illuminate\Database\Eloquent\Collection;

/**
 * Solicitudes de revisión que los estudiantes envían desde su perfil y que
 * requieren aprobación del personal con acceso al expediente privado.
 */
final class StudentReviewRequests
{
    /**
     * Documentos cargados o reemplazados por el estudiante que aún esperan
     * revisión.
     *
     * @return Collection<int, AdmissionDocument>
     */
    public static function pending(): Collection
    {
        return AdmissionDocument::query()
            ->whereNotNull('review_requested_at')
            ->where('status', AdmissionDocumentStatus::Pendiente->value)
            ->whereHas('admission', static fn ($query) => $query->whereNotNull('converted_user_id'))
            ->with(['admission.convertedUser.studentProfile'])
            ->orderByDesc('review_requested_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Resumen para la campana y el menú lateral del portal administrativo.
     *
     * @return array{pending_students: int, pending_total: int, items: array<int, array{id: int, student_name: string, student_code: string|null, type: string, type_label: string, message: string, requested_at: string|null, url: string|null}>}
     */
    public static function overview(int $limit = 8): array
    {
        $documents = self::pending();

        return [
            'pending_students' => $documents
                ->map(static fn (AdmissionDocument $document): ?int => $document->admission?->converted_user_id)
                ->filter(static fn (?int $studentId): bool => $studentId !== null)
                ->unique()
                ->count(),
            'pending_total' => $documents->count(),
            'items' => $documents
                ->take($limit)
                ->map(static function (AdmissionDocument $document): array {
                    $admission = $document->admission;
                    $student = $admission?->convertedUser;
                    $code = $student?->studentProfile?->student_code;
                    $name = $student->name;
                    $typeLabel = $document->typeLabel();

                    return [
                        'id' => $document->id,
                        'student_name' => $name,
                        'student_code' => $code,
                        'type' => $document->type,
                        'type_label' => $typeLabel,
                        'message' => $name.' ha solicitado revisión de documento: '.$typeLabel,
                        'requested_at' => $document->review_requested_at?->format('d/m/Y h:i a'),
                        'url' => match (true) {
                            $code !== null => route('admin.students.show', ['student' => $code]),
                            $admission !== null => route('admin.admissions.show', ['admission' => $admission->code]),
                            default => null,
                        },
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /**
     * Cantidad y tipos de solicitudes pendientes por estudiante.
     *
     * @return array<int, array{count: int, labels: array<int, string>}>
     */
    public static function groupedByStudent(): array
    {
        /** @var array<int, array{count: int, labels: array<int, string>}> $grouped */
        $grouped = [];

        foreach (self::pending() as $document) {
            $studentId = $document->admission?->converted_user_id;

            if ($studentId === null) {
                continue;
            }

            $grouped[$studentId] ??= ['count' => 0, 'labels' => []];
            $grouped[$studentId]['count']++;

            $label = $document->typeLabel();

            if (! in_array($label, $grouped[$studentId]['labels'], true)) {
                $grouped[$studentId]['labels'][] = $label;
            }
        }

        return $grouped;
    }
}
