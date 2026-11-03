<?php

namespace App\Support;

/**
 * Opciones académicas compartidas por carreras y materias.
 *
 * Centraliza las modalidades, horarios y turnos para que el backend y el
 * frontend usen las mismas etiquetas y valores.
 */
final class AcademicOptions
{
    /**
     * @var array<string, string>
     */
    public const MODALITIES = [
        'presencial' => 'Presencial',
        'online' => 'Online',
        'mixta' => 'Semipresencial',
    ];

    /**
     * @var array<string, string>
     */
    public const SCHEDULES = [
        'lunes_viernes' => 'Lunes a viernes',
        'sabatino' => 'Sabatino',
    ];

    /**
     * @var array<string, string>
     */
    public const SHIFTS = [
        'diurno' => 'Diurno',
        'nocturno' => 'Nocturno',
    ];

    /**
     * Etiqueta legible de una modalidad.
     */
    public static function modalityLabel(?string $modality): string
    {
        return self::MODALITIES[$modality ?? ''] ?? 'Semipresencial';
    }

    /**
     * Etiqueta legible de un horario.
     */
    public static function scheduleLabel(?string $schedule): string
    {
        return self::SCHEDULES[$schedule ?? ''] ?? 'Lunes a viernes';
    }

    /**
     * Etiqueta legible de un turno.
     */
    public static function shiftLabel(?string $shift): string
    {
        return self::SHIFTS[$shift ?? ''] ?? 'Diurno';
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function modalityOptions(): array
    {
        return self::options(self::MODALITIES);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function scheduleOptions(): array
    {
        return self::options(self::SCHEDULES);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function shiftOptions(): array
    {
        return self::options(self::SHIFTS);
    }

    /**
     * @param  array<string, string>  $values
     * @return array<int, array{value: string, label: string}>
     */
    private static function options(array $values): array
    {
        return array_map(
            static fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ],
            $values,
            array_keys($values),
        );
    }
}
