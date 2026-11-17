<?php

namespace App\Support;

/**
 * Reglas de ponderación de los planes de evaluación.
 *
 * Cada evaluación vale entre 5 % y 20 % y el plan no puede superar el 100 %.
 * Las notas de cada evaluación se cargan en la escala de 1 a 20. La definitiva
 * sobre 10 es la suma de los aportes de cada evaluación calificada (nota ÷ 2 ×
 * porcentaje), así que solo llega a la escala completa cuando el plan está
 * 100 % calificado; 6 es la mínima aprobatoria.
 */
final class EvaluationPlanGrading
{
    /**
     * Porcentaje mínimo de una sola evaluación.
     */
    public const MIN_ITEM_WEIGHT = 5;

    /**
     * Porcentaje máximo de una sola evaluación.
     */
    public const MAX_ITEM_WEIGHT = 20;

    /**
     * Porcentaje total del plan.
     */
    public const TOTAL_WEIGHT = 100;

    /**
     * Nota máxima de cada evaluación.
     */
    public const MAX_ITEM_SCORE = 20.0;

    /**
     * Nota mínima aprobatoria sobre la escala de 1 a 10.
     */
    public const PASSING_GRADE = 6.0;

    /**
     * Escala de la nota definitiva.
     */
    public const FINAL_SCALE = 10;

    /**
     * Aporte de una evaluación a la definitiva sobre 10: la nota llevada a la
     * escala de 1 a 10 multiplicada por el porcentaje que pesa en el plan.
     */
    public static function contribution(?float $score, int $weight): ?float
    {
        $scoreTen = self::toScaleTen($score);

        return $scoreTen === null || $weight <= 0
            ? null
            : round($scoreTen * ($weight / 100), 2);
    }

    /**
     * Definitiva acumulada sobre 10: suma de los aportes de las evaluaciones
     * calificadas, sin normalizar por el porcentaje faltante.
     *
     * @param  array<int, array{score: float|null, weight: int}>  $entries
     */
    public static function accumulatedTen(array $entries): ?float
    {
        $total = 0.0;
        $graded = 0;

        foreach ($entries as $entry) {
            $contribution = self::contribution($entry['score'], $entry['weight']);

            if ($contribution === null) {
                continue;
            }

            $total += $contribution;
            $graded++;
        }

        return $graded === 0 ? null : round($total, 2);
    }

    /**
     * Convierte una nota de la escala 1-20 a la escala 1-10.
     */
    public static function toScaleTen(?float $score): ?float
    {
        return $score === null ? null : round($score / 2, 2);
    }

    /**
     * Indica si una nota sobre 10 aprueba la unidad curricular. Solo se
     * resuelve cuando el plan está completo y todas sus notas cargadas.
     */
    public static function isApproved(?float $scoreTen, bool $complete): ?bool
    {
        return $scoreTen === null || ! $complete
            ? null
            : $scoreTen >= self::PASSING_GRADE;
    }

    /**
     * Porcentaje que falta por asignar en el plan.
     */
    public static function missingWeight(int $totalWeight): int
    {
        return max(0, self::TOTAL_WEIGHT - $totalWeight);
    }

    /**
     * Reglas de ponderación compartidas con el frontend.
     *
     * @return array{
     *     min_item_weight: int,
     *     max_item_weight: int,
     *     total_weight: int,
     *     max_item_score: float,
     *     passing_grade: float,
     *     final_scale: int
     * }
     */
    public static function limits(): array
    {
        return [
            'min_item_weight' => self::MIN_ITEM_WEIGHT,
            'max_item_weight' => self::MAX_ITEM_WEIGHT,
            'total_weight' => self::TOTAL_WEIGHT,
            'max_item_score' => self::MAX_ITEM_SCORE,
            'passing_grade' => self::PASSING_GRADE,
            'final_scale' => self::FINAL_SCALE,
        ];
    }
}
