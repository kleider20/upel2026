<?php

namespace App\Enums;

/**
 * Estados por los que atraviesa una solicitud de preinscripción.
 */
enum AdmissionStatus: string
{
    case Recibida = 'recibida';
    case EnRevision = 'en_revision';
    case Observada = 'observada';
    case Aprobada = 'aprobada';
    case Rechazada = 'rechazada';
    case Convertida = 'convertida';

    /**
     * Etiqueta legible para la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::Recibida => 'Recibida',
            self::EnRevision => 'En revisión',
            self::Observada => 'Observada',
            self::Aprobada => 'Aprobada',
            self::Rechazada => 'Rechazada',
            self::Convertida => 'Convertida en estudiante',
        };
    }

    /**
     * Descripción del estado para el aspirante.
     */
    public function description(): string
    {
        return match ($this) {
            self::Recibida => 'Recibimos tu solicitud. El equipo de admisión la revisará en los próximos días.',
            self::EnRevision => 'Tu solicitud está siendo evaluada por el equipo de admisión.',
            self::Observada => 'Necesitamos que corrijas o completes algún dato o documento.',
            self::Aprobada => 'Tu solicitud fue aprobada. Pronto se creará tu cuenta de estudiante.',
            self::Rechazada => 'Tu solicitud no fue admitida en esta oportunidad.',
            self::Convertida => 'Ya eres estudiante UPEL. Revisa el correo con las instrucciones de acceso.',
        };
    }

    /**
     * Tono visual del estado.
     */
    public function tone(): string
    {
        return match ($this) {
            self::Recibida => 'blue',
            self::EnRevision => 'amber',
            self::Observada => 'gold',
            self::Aprobada => 'green',
            self::Rechazada => 'red',
            self::Convertida => 'navy',
        };
    }

    /**
     * Indica si el estado cierra el proceso.
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::Rechazada, self::Convertida], true);
    }

    /**
     * Indica si el aspirante puede subir o reemplazar documentos.
     */
    public function allowsDocumentUpload(): bool
    {
        return in_array($this, [
            self::Recibida,
            self::EnRevision,
            self::Observada,
        ], true);
    }

    /**
     * Estados a los que puede pasar una solicitud.
     *
     * @return array<int, self>
     */
    public function transitions(): array
    {
        return match ($this) {
            self::Recibida => [self::EnRevision, self::Observada, self::Aprobada, self::Rechazada],
            self::EnRevision => [self::Observada, self::Aprobada, self::Rechazada],
            self::Observada => [self::EnRevision, self::Aprobada, self::Rechazada],
            self::Aprobada => [self::Convertida],
            self::Rechazada, self::Convertida => [],
        };
    }

    /**
     * Indica si la transición solicitada es válida.
     */
    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->transitions(), true);
    }

    /**
     * Estados que el administrador puede fijar manualmente.
     *
     * @return array<int, self>
     */
    public static function reviewable(): array
    {
        return [
            self::EnRevision,
            self::Observada,
            self::Aprobada,
            self::Rechazada,
        ];
    }
}
