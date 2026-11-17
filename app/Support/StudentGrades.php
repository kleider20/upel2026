<?php

namespace App\Support;

use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanScore;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Calificaciones del estudiante a partir del plan de evaluación del docente.
 *
 * Cada evaluación del plan se lista con la nota cargada (escala 1 a 20) y su
 * aporte a la definitiva (escala 1 a 10). La definitiva es la suma de los
 * aportes, igual que en la planilla del docente, y solo alcanza la escala
 * completa cuando el plan está al 100 % y todas sus evaluaciones están
 * calificadas; 6 es la mínima aprobatoria.
 */
final class StudentGrades
{
    /**
     * Resumen de notas de cada inscripción.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @return array<int, array{
     *     plan_id: int|null,
     *     items_count: int,
     *     graded_count: int,
     *     definitive: float|null,
     *     graded_at: CarbonInterface|null,
     *     condition: string,
     *     condition_label: string,
     *     condition_tone: string,
     *     evaluations: array<int, array{
     *         title: string,
     *         scheduled_on: string,
     *         weight: int,
     *         score: float|null,
     *         contribution: float|null
     *     }>,
     *     upcoming: array<int, array{title: string, scheduled_on: string, date: string}>
     * }>
     */
    public static function breakdown(Collection $enrollments): array
    {
        if ($enrollments->isEmpty()) {
            return [];
        }

        $plans = EvaluationPlan::query()
            ->with('items')
            ->whereIn('subject_id', $enrollments->pluck('subject_id')->unique()->values()->all())
            ->orderBy('id')
            ->get()
            ->groupBy('subject_id');

        $scores = EvaluationPlanScore::query()
            ->whereIn('enrollment_id', $enrollments->pluck('id')->all())
            ->get()
            ->groupBy('enrollment_id');

        $rows = [];

        foreach ($enrollments as $enrollment) {
            $plan = self::planFor($enrollment, $plans->get($enrollment->subject_id) ?? collect());
            $itemScores = ($scores->get($enrollment->id) ?? collect())->keyBy('evaluation_plan_item_id');
            $items = $plan?->items ?? collect();

            $evaluations = [];
            $upcoming = [];
            $entries = [];
            $graded = 0;
            $today = now()->startOfDay();

            foreach ($items as $item) {
                $score = $itemScores->get($item->id)?->score;

                if ($score !== null) {
                    $graded++;
                } elseif ($item->scheduled_on->greaterThanOrEqualTo($today)) {
                    $upcoming[] = [
                        'title' => $item->title,
                        'scheduled_on' => $item->scheduled_on->format('d/m/Y'),
                        'date' => $item->scheduled_on->toDateString(),
                    ];
                }

                $entries[] = ['score' => $score, 'weight' => $item->weight];

                $evaluations[] = [
                    'title' => $item->title,
                    'scheduled_on' => $item->scheduled_on->format('d/m/Y'),
                    'weight' => $item->weight,
                    'score' => $score,
                    'contribution' => EvaluationPlanGrading::contribution($score, $item->weight),
                ];
            }

            $definitive = EvaluationPlanGrading::accumulatedTen($entries);
            $count = $items->count();
            $planComplete = $plan?->isComplete() ?? false;
            $complete = $plan !== null && $count > 0 && $graded === $count && $planComplete;

            [$condition, $conditionLabel, $conditionTone] = self::condition(
                $enrollment,
                $plan,
                $graded,
                $count,
                $complete,
                $definitive,
            );

            $gradedAt = $itemScores
                ->filter(static fn (EvaluationPlanScore $score): bool => $score->updated_at !== null)
                ->sortByDesc(static fn (EvaluationPlanScore $score): int => $score->updated_at->getTimestamp())
                ->first()?->updated_at;

            $rows[$enrollment->id] = [
                'plan_id' => $plan?->id,
                'items_count' => $count,
                'graded_count' => $graded,
                'definitive' => $definitive,
                'graded_at' => $gradedAt,
                'condition' => $condition,
                'condition_label' => $conditionLabel,
                'condition_tone' => $conditionTone,
                'evaluations' => $evaluations,
                'upcoming' => $upcoming,
            ];
        }

        return $rows;
    }

    /**
     * Plan del docente que corresponde a la inscripción.
     *
     * @param  Collection<int, EvaluationPlan>  $candidates
     */
    private static function planFor(Enrollment $enrollment, Collection $candidates): ?EvaluationPlan
    {
        if ($candidates->isEmpty()) {
            return null;
        }

        $samePeriod = $candidates->where('academic_period_id', $enrollment->academic_period_id);
        $pool = $samePeriod->isNotEmpty() ? $samePeriod->values() : $candidates->values();

        return $pool->first(static fn (EvaluationPlan $plan): bool => $enrollment->professor_id !== null
            && $plan->professor_id === $enrollment->professor_id) ?? $pool->first();
    }

    /**
     * Condición de la materia según las notas cargadas por el docente.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private static function condition(
        Enrollment $enrollment,
        ?EvaluationPlan $plan,
        int $graded,
        int $count,
        bool $complete,
        ?float $definitive,
    ): array {
        if ($enrollment->status === 'aprobado') {
            return ['aprobado', 'Aprobado', 'green'];
        }

        if ($enrollment->status === 'reprobado') {
            return ['reprobado', 'Reprobado', 'red'];
        }

        if ($enrollment->status === 'retirado') {
            return ['retirado', 'Retirado', 'slate'];
        }

        if ($plan === null || $count === 0 || $graded === 0) {
            return ['cursando', 'Cursando', 'slate'];
        }

        if (! $complete) {
            return $graded < $count
                ? ['faltan_notas', 'Faltan notas', 'amber']
                : ['plan_incompleto', 'Plan incompleto', 'amber'];
        }

        return $definitive !== null && $definitive >= EvaluationPlanGrading::PASSING_GRADE
            ? ['aprobado', 'Aprobado', 'green']
            : ['reprobado', 'Reprobado', 'red'];
    }
}
