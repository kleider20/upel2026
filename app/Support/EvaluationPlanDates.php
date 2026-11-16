<?php

namespace App\Support;

use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Fechas en las que se puede programar una evaluación.
 *
 * Los días de clase de cada materia viven en el pivote del horario; el plan de
 * evaluación solo admite fechas que coincidan con esos días. Cuando la materia
 * no tiene días asignados, el formulario muestra "Sin horario asignado".
 */
final class EvaluationPlanDates
{
    /**
     * Días de clase que el horario asigna a una materia.
     *
     * @return array<int, string>
     */
    public static function forScheduleSubject(?Schedule $schedule, ?int $subjectId): array
    {
        if ($schedule === null || $subjectId === null) {
            return [];
        }

        $subject = $schedule->subjects()->whereKey($subjectId)->first();

        return $subject === null ? [] : self::normalize($subject->pivot->dates);
    }

    /**
     * Opciones {value, label} para los formularios, ordenadas por fecha.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(mixed $dates): array
    {
        return array_map(
            static fn (string $date): array => [
                'value' => $date,
                'label' => self::label($date),
            ],
            self::normalize($dates),
        );
    }

    /**
     * Indica si la fecha corresponde a uno de los días de clase.
     *
     * @param  array<int, string>  $dates
     */
    public static function includes(array $dates, string $date): bool
    {
        return in_array(Carbon::parse($date)->toDateString(), $dates, true);
    }

    /**
     * Indica si otra evaluación del plan ya ocupa esa fecha.
     *
     * Cada día de clase se usa una sola vez: al elegir la fecha de la segunda
     * evaluación, la fecha de la primera deja de estar disponible.
     */
    public static function isUsed(
        EvaluationPlan $plan,
        string $date,
        ?int $ignoreItemId = null,
    ): bool {
        $target = Carbon::parse($date)->toDateString();

        return $plan->items()
            ->when(
                $ignoreItemId !== null,
                static fn (Builder $query): Builder => $query->where('id', '!=', $ignoreItemId),
            )
            ->get(['id', 'scheduled_on'])
            ->contains(
                static fn (EvaluationPlanItem $item): bool => $item->scheduled_on->toDateString() === $target,
            );
    }

    /**
     * Etiqueta corta con el día de la semana: "Sáb 07/03/2026".
     */
    public static function label(string $date): string
    {
        $parsed = Carbon::parse($date);
        $weekday = ScheduleCalendar::WEEKDAYS_SHORT[$parsed->dayOfWeekIso] ?? '';

        return trim($weekday.' '.$parsed->format('d/m/Y'));
    }

    /**
     * Normaliza las fechas guardadas en el pivote del horario.
     *
     * @return array<int, string>
     */
    private static function normalize(mixed $dates): array
    {
        if (is_string($dates)) {
            $dates = json_decode($dates, true);
        }

        if (! is_array($dates)) {
            return [];
        }

        $normalized = [];

        foreach ($dates as $date) {
            if (! is_string($date) || trim($date) === '') {
                continue;
            }

            $normalized[] = Carbon::parse($date)->toDateString();
        }

        $normalized = array_values(array_unique($normalized));

        sort($normalized);

        return $normalized;
    }
}
