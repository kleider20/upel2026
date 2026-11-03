<?php

namespace App\Enums;

/**
 * Documentos que el aspirante debe consignar para completar su expediente.
 */
enum AdmissionDocumentType: string
{
    case TituloBachiller = 'titulo_bachiller';
    case NotasCertificadas = 'notas_certificadas';
    case Cedula = 'cedula';
    case Foto = 'foto';

    /**
     * Etiqueta legible para la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::TituloBachiller => 'Título de bachiller',
            self::NotasCertificadas => 'Notas certificadas',
            self::Cedula => 'Cédula de identidad',
            self::Foto => 'Fotografía tipo carnet',
        };
    }

    /**
     * Indicaciones para el aspirante.
     */
    public function description(): string
    {
        return match ($this) {
            self::TituloBachiller => 'Fondo negro o título provisional emitido por el plantel.',
            self::NotasCertificadas => 'Constancia de notas de 1.º a 5.º año, firmada y sellada.',
            self::Cedula => 'Cédula de identidad vigente, ambas caras en un solo archivo.',
            self::Foto => 'Foto reciente, fondo blanco, sin gorra ni lentes oscuros.',
        };
    }

    /**
     * Indica si el documento es obligatorio para aprobar la solicitud.
     */
    public function isRequired(): bool
    {
        return true;
    }

    /**
     * Formatos aceptados por tipo de documento.
     *
     * @return array<int, string>
     */
    public function acceptedMimes(): array
    {
        return match ($this) {
            self::Foto => ['jpg', 'jpeg', 'png'],
            default => ['pdf', 'jpg', 'jpeg', 'png'],
        };
    }

    /**
     * Todos los tipos como opciones para formularios.
     *
     * @return array<int, array{value: string, label: string, description: string, required: bool, accept: string}>
     */
    public static function options(): array
    {
        return array_map(static fn (self $type): array => [
            'value' => $type->value,
            'label' => $type->label(),
            'description' => $type->description(),
            'required' => $type->isRequired(),
            'accept' => '.'.implode(',.', $type->acceptedMimes()),
        ], self::cases());
    }
}
