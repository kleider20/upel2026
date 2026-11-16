<?php

namespace App\Enums;

/**
 * Tipo de programa académico al que pertenece una carrera.
 *
 * Se imprime en la planilla de evaluación como «Programa» y permite separar
 * pregrado, postgrado, cursos y talleres.
 */
enum ProgramType: string
{
    case Pregrado = 'pregrado';
    case Postgrado = 'postgrado';
    case Curso = 'curso';
    case Taller = 'taller';

    /**
     * Etiqueta legible para la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pregrado => 'Pregrado',
            self::Postgrado => 'Postgrado',
            self::Curso => 'Curso',
            self::Taller => 'Taller',
        };
    }

    /**
     * Etiqueta legible de un valor almacenado.
     */
    public static function labelFor(?string $value): string
    {
        return self::tryFrom((string) $value)?->label() ?? self::Pregrado->label();
    }

    /**
     * Valores válidos para las reglas de validación.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $case): string => $case->value,
            self::cases(),
        );
    }

    /**
     * Opciones para los formularios.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $case): array => [
                'value' => $case->value,
                'label' => $case->label(),
            ],
            self::cases(),
        );
    }
}
