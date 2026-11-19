<?php

namespace Database\Seeders\Concerns;

/**
 * Normaliza los nombres escritos en mayúsculas para mostrarlos en formato de título.
 */
trait FormatsNames
{
    /**
     * Conectores que se escriben en minúscula dentro de los nombres.
     *
     * @var array<int, string>
     */
    protected const PARTICLES = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];

    /**
     * Convierte "YERLY AYMARA VÁSQUEZ LUCERO" en "Yerly Aymara Vásquez Lucero".
     */
    protected function formatDisplayName(string $name): string
    {
        $words = preg_split('/\s+/', mb_strtolower(trim($name), 'UTF-8')) ?: [];

        $normalized = array_map(
            static function (string $word, int $position): string {
                if ($position > 0 && in_array($word, self::PARTICLES, true)) {
                    return $word;
                }

                return mb_convert_case($word, MB_CASE_TITLE, 'UTF-8');
            },
            $words,
            array_keys($words),
        );

        return implode(' ', $normalized);
    }
}
