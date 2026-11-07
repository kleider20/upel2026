<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Construye las columnas del horario a partir de un rango de fechas.
 *
 * Sabatino usa una columna por sábado; lunes a viernes agrupa los días de
 * clase por semana para que la cuadrícula siga siendo legible.
 */
final class ScheduleCalendar
{
    /**
     * @var array<int, string>
     */
    public const MONTHS = [
        1 => 'Enero',
        2 => 'Febrero',
        3 => 'Marzo',
        4 => 'Abril',
        5 => 'Mayo',
        6 => 'Junio',
        7 => 'Julio',
        8 => 'Agosto',
        9 => 'Septiembre',
        10 => 'Octubre',
        11 => 'Noviembre',
        12 => 'Diciembre',
    ];

    /**
     * @var array<int, string>
     */
    public const WEEKDAYS = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
        7 => 'Domingo',
    ];

    /**
     * @var array<int, string>
     */
    public const WEEKDAYS_SHORT = [
        1 => 'Lun',
        2 => 'Mar',
        3 => 'Mié',
        4 => 'Jue',
        5 => 'Vie',
        6 => 'Sáb',
        7 => 'Dom',
    ];

    /**
     * @var array<int, string>
     */
    private const WEEKDAY_LETTERS = [
        1 => 'L',
        2 => 'M',
        3 => 'X',
        4 => 'J',
        5 => 'V',
    ];

    /**
     * Columnas del horario entre dos fechas.
     *
     * @return array<int, array{
     *     date: string,
     *     week: int,
     *     week_number: int,
     *     month: string,
     *     tone: string,
     *     day: string,
     *     weekday: string,
     *     dates: array<int, string>,
     *     highlight: null
     * }>
     */
    public static function weeks(string $startsOn, string $endsOn, string $schedule): array
    {
        $start = Carbon::parse($startsOn)->startOfDay();
        $end = Carbon::parse($endsOn)->startOfDay();

        if ($end->lessThan($start)) {
            return [];
        }

        return $schedule === 'sabatino'
            ? self::saturdayWeeks($start, $end)
            : self::weekdayWeeks($start, $end);
    }

    /**
     * Fechas de clase disponibles entre dos fechas.
     *
     * @return array<int, string>
     */
    public static function classDates(string $startsOn, string $endsOn, string $schedule): array
    {
        $dates = [];

        foreach (self::weeks($startsOn, $endsOn, $schedule) as $week) {
            foreach ($week['dates'] as $date) {
                $dates[] = $date;
            }
        }

        return $dates;
    }

    /**
     * Conserva solo las semanas y fechas elegidas para las materias.
     *
     * @param  array<int, array<string, mixed>>  $weeks
     * @param  array<int, string>  $selectedDates
     * @return array<int, array<string, mixed>>
     */
    public static function selectedWeeks(array $weeks, array $selectedDates): array
    {
        $selectedDateSet = array_flip($selectedDates);
        $selectedWeeks = [];

        foreach ($weeks as $week) {
            $dates = array_values(array_filter(
                $week['dates'],
                static fn (string $date): bool => isset($selectedDateSet[$date]),
            ));

            if ($dates === []) {
                continue;
            }

            $firstSelectedDate = Carbon::parse($dates[0]);
            $months = array_unique(array_map(
                static fn (string $date): int => (int) Carbon::parse($date)->format('m'),
                $dates,
            ));

            $week['date'] = $dates[0];
            $week['dates'] = $dates;
            $week['month'] = self::MONTHS[$firstSelectedDate->month];
            $week['tone'] = strtolower(self::MONTHS[$firstSelectedDate->month]);
            $week['day'] = implode(', ', array_map(
                static function (string $date) use ($months): string {
                    $parsedDate = Carbon::parse($date);

                    return count($months) > 1
                        ? $parsedDate->format('d/m')
                        : $parsedDate->format('d');
                },
                $dates,
            ));
            $selectedWeeks[] = $week;
        }

        return $selectedWeeks;
    }

    /**
     * Etiqueta de 12 horas para una franja de clase.
     */
    public static function timeLabel(?string $startsAt, ?string $endsAt): string
    {
        if ($startsAt === null || $endsAt === null || $startsAt === '' || $endsAt === '') {
            return '';
        }

        return self::formatTime($startsAt).' - '.self::formatTime($endsAt);
    }

    /**
     * Etiqueta compacta para celdas del PDF.
     */
    public static function compactTimeLabel(?string $startsAt, ?string $endsAt): string
    {
        if ($startsAt === null || $endsAt === null || $startsAt === '' || $endsAt === '') {
            return '';
        }

        return self::compactTime($startsAt).'-'.self::compactTime($endsAt);
    }

    /**
     * Hora de inicio resumida para las celdas del PDF.
     */
    public static function compactStartTime(?string $startsAt): string
    {
        if ($startsAt === null || $startsAt === '') {
            return '';
        }

        $parsed = Carbon::parse($startsAt);
        $hour = $parsed->hour % 12;

        return (string) ($hour === 0 ? 12 : $hour);
    }

    /**
     * Nombres cortos de los días seleccionados dentro de una semana.
     *
     * @param  array<int, string>  $dates
     */
    public static function daysLabel(array $dates): string
    {
        $days = self::weekdayNumbers($dates);

        if (count($days) === 5) {
            return 'Lun a Vie';
        }

        return implode(', ', array_map(
            static fn (int $day): string => self::WEEKDAYS_SHORT[$day],
            $days,
        ));
    }

    /**
     * Días abreviados para celdas del PDF.
     *
     * @param  array<int, string>  $dates
     */
    public static function compactDays(array $dates): string
    {
        $days = self::weekdayNumbers($dates);

        if (count($days) === 5) {
            return 'L-V';
        }

        return implode('', array_map(
            static fn (int $day): string => self::WEEKDAY_LETTERS[$day],
            $days,
        ));
    }

    /**
     * Franjas horarias únicas, numeradas para la leyenda del horario.
     *
     * @param  array<int, array{starts_at: string, ends_at: string}>  $subjects
     * @return array<int, string>
     */
    public static function timeSlots(array $subjects): array
    {
        $slots = [];

        foreach ($subjects as $subject) {
            $label = self::timeLabel($subject['starts_at'], $subject['ends_at']);

            if ($label !== '') {
                $slots[$label] = [$subject['starts_at'], $subject['ends_at']];
            }
        }

        uasort(
            $slots,
            static fn (array $a, array $b): int => strcmp($a[0], $b[0]) ?: strcmp($a[1], $b[1]),
        );

        $labels = [];

        foreach (array_keys($slots) as $index => $label) {
            $labels[] = ($index + 1).'.- '.$label;
        }

        return $labels;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function saturdayWeeks(Carbon $start, Carbon $end): array
    {
        $weeks = [];
        $date = $start->copy();

        while ($date->lessThanOrEqualTo($end)) {
            if ($date->dayOfWeekIso !== Carbon::SATURDAY) {
                $date->addDay();

                continue;
            }

            $weeks[] = self::weekEntry(count($weeks) + 1, [$date->toDateString()], $date->format('d'), $date, 'Sábado');
            $date->addDay();
        }

        return $weeks;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function weekdayWeeks(Carbon $start, Carbon $end): array
    {
        $groups = [];
        $date = $start->copy();

        while ($date->lessThanOrEqualTo($end)) {
            if ($date->dayOfWeekIso > Carbon::FRIDAY) {
                $date->addDay();

                continue;
            }

            $key = $date->isoWeekYear().'-'.str_pad((string) $date->isoWeek(), 2, '0', STR_PAD_LEFT);
            $groups[$key] ??= [];
            $groups[$key][] = $date->copy();
            $date->addDay();
        }

        $weeks = [];

        foreach ($groups as $dates) {
            $first = $dates[0];
            $last = $dates[count($dates) - 1];
            $day = $first->month === $last->month
                ? $first->format('d').'-'.$last->format('d')
                : $first->format('d/m').'-'.$last->format('d/m');

            $weeks[] = self::weekEntry(
                count($weeks) + 1,
                array_map(static fn (Carbon $item): string => $item->toDateString(), $dates),
                $day,
                $first,
                'Lunes a Viernes',
            );
        }

        return $weeks;
    }

    /**
     * @param  array<int, string>  $dates
     * @return array<string, mixed>
     */
    private static function weekEntry(int $position, array $dates, string $day, Carbon $monthDate, string $weekday): array
    {
        return [
            'date' => $dates[0],
            'week' => $position,
            'week_number' => $position,
            'month' => self::MONTHS[$monthDate->month],
            'tone' => strtolower(self::MONTHS[$monthDate->month]),
            'day' => $day,
            'weekday' => $weekday,
            'dates' => $dates,
            'highlight' => null,
        ];
    }

    /**
     * @param  array<int, string>  $dates
     * @return array<int, int>
     */
    private static function weekdayNumbers(array $dates): array
    {
        $days = [];

        foreach ($dates as $date) {
            $days[Carbon::parse($date)->dayOfWeekIso] = true;
        }

        ksort($days);

        return array_keys($days);
    }

    private static function formatTime(string $time): string
    {
        $parsed = Carbon::parse($time);
        $hour = $parsed->hour % 12;
        $hour = $hour === 0 ? 12 : $hour;
        $suffix = $parsed->hour < 12 ? 'am' : 'pm';

        return "{$hour}:".str_pad((string) $parsed->minute, 2, '0', STR_PAD_LEFT)." {$suffix}";
    }

    private static function compactTime(string $time): string
    {
        $parsed = Carbon::parse($time);
        $hour = $parsed->hour % 12;
        $hour = $hour === 0 ? 12 : $hour;

        return $parsed->minute === 0
            ? (string) $hour
            : $hour.':'.str_pad((string) $parsed->minute, 2, '0', STR_PAD_LEFT);
    }
}
