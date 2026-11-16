<?php

namespace App\Support;

/**
 * Reglas de ponderación de los planes de evaluación.
 *
 * Cada evaluación vale entre 5 % y 20 % y el plan no puede superar el 100 %.
 * Las notas de cada evaluación se cargan en la escala de 1 a 20 y la nota
 * definitiva se muestra sobre 10, donde 6 es la mínima aprobatoria.
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
     * Promedio ponderado de las evaluaciones ya calificadas.
     *
     * Se divide entre la suma de los porcentajes calificados para que la nota
     * definitiva avance a medida que el docente carga las notas y coincida con
     * la ponderación oficial cuando el plan está completo.
     *
     * @param  array<int, array{score: float|null, weight: int}>  $entries
     */
    public static function weightedScore(array $entries): ?float
    {
        $weighted = 0.0;
        $weights = 0;

        foreach ($entries as $entry) {
            if ($entry['score'] === null || $entry['weight'] <= 0) {
                continue;
            }

            $weighted += $entry['score'] * $entry['weight'];
            $weights += $entry['weight'];
        }

        return $weights === 0 ? null : round($weighted / $weights, 2);
    }

    /**
     * Convierte una nota de la escala 1-20 a la escala 1-10.
     */
    public static function toScaleTen(?float $score): ?float
    {
        return $score === null ? null : round($score / 2, 2);
    }

    /**
     * Indica si una nota sobre 10 aprueba la unidad curricular.
     */
    public static function isApproved(?float $scoreTen): ?bool
    {
        return $scoreTen === null ? null : $scoreTen >= self::PASSING_GRADE;
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
