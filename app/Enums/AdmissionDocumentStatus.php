<?php

namespace App\Enums;

/**
 * Resultado de la revisión de un documento del expediente.
 */
enum AdmissionDocumentStatus: string
{
    case Pendiente = 'pendiente';
    case Validado = 'validado';
    case Rechazado = 'rechazado';

    /**
     * Etiqueta legible para la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pendiente => 'Pendiente de revisión',
            self::Validado => 'Validado',
            self::Rechazado => 'Rechazado',
        };
    }

    /**
     * Tono visual del estado.
     */
    public function tone(): string
    {
        return match ($this) {
            self::Pendiente => 'amber',
            self::Validado => 'green',
            self::Rechazado => 'red',
        };
    }
}
