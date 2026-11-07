<?php

namespace App\Support;

use App\Models\Schedule;

/**
 * Horarios de actividades presenciales por carrera y período académico.
 *
 * Los datos se transcriben de los horarios publicados por la Coordinación de
 * Docencia del Instituto de Mejoramiento Profesional del Magisterio. Cada
 * semana conserva el día en que se imparte para poder filtrar el horario según
 * el horario de estudio que el estudiante eligió en su preinscripción.
 */
final class StudentSchedule
{
    /**
     * Franjas horarias de las actividades presenciales.
     *
     * @var array<int, string>
     */
    private const TIME_SLOTS = [
        1 => '1.- 8:00 am a 11:00am',
        2 => '2.- 11:30 am a 2:30 pm',
        3 => '3.- 3:00pm a 6:00 pm',
    ];

    /**
     * Días que corresponden a cada horario de estudio.
     *
     * @var array<string, array<int, string>>
     */
    private const SCHEDULE_DAYS = [
        'sabatino' => ['Sábado'],
        'lunes_viernes' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    ];

    /**
     * Horarios disponibles por código de carrera y período.
     *
     * @var array<string, array<int, array<string, mixed>>>
     */
    private const CATALOG = [
        'EDPRI' => [
            1 => [
                'title' => 'HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO 2025-II',
                'career' => 'Educación Primaria',
                'cohort' => '2025-II',
                'period' => 'I',
                'weeks' => [
                    ['week' => 1, 'month' => 'Octubre', 'tone' => 'octubre', 'day' => '18', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 2, 'month' => 'Octubre', 'tone' => 'octubre', 'day' => '25', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 3, 'month' => 'Noviembre', 'tone' => 'noviembre', 'day' => '01', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 4, 'month' => 'Noviembre', 'tone' => 'noviembre', 'day' => '08', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 5, 'month' => 'Noviembre', 'tone' => 'noviembre', 'day' => '15', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 6, 'month' => 'Noviembre', 'tone' => 'noviembre', 'day' => '22', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 7, 'month' => 'Noviembre', 'tone' => 'noviembre', 'day' => '29', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 8, 'month' => 'Dic', 'tone' => 'diciembre', 'day' => '06', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 9, 'month' => 'Enero', 'tone' => 'enero', 'day' => '10', 'weekday' => 'Sábado', 'highlight' => 'red'],
                    ['week' => 10, 'month' => 'Enero', 'tone' => 'enero', 'day' => '17', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 11, 'month' => 'Enero', 'tone' => 'enero', 'day' => '24', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 12, 'month' => 'Enero', 'tone' => 'enero', 'day' => '31', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 13, 'month' => 'Febrero', 'tone' => 'febrero', 'day' => '07', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 14, 'month' => 'Febrero', 'tone' => 'febrero', 'day' => '14', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 15, 'month' => 'Febrero', 'tone' => 'febrero', 'day' => '21', 'weekday' => 'Sábado', 'highlight' => null],
                    ['week' => 16, 'month' => 'Febrero', 'tone' => 'febrero', 'day' => '28', 'weekday' => 'Sábado', 'highlight' => 'yellow'],
                ],
                'subjects' => [
                    [
                        'code' => 'INT4380',
                        'name' => 'Introducción al Estudio de la Lengua',
                        'teacher' => 'Edilia Díaz',
                        'hours' => [3 => '8', 5 => '8', 7 => '8', 9 => '8', 11 => '8', 13 => '8', 15 => '8'],
                    ],
                    [
                        'code' => 'EDU0101',
                        'name' => 'Educación Alimentaria y Nutricional',
                        'teacher' => 'María De Abreu',
                        'hours' => [2 => '12', 4 => '3', 6 => '3', 8 => '3', 10 => '3', 12 => '3'],
                    ],
                    [
                        'code' => 'DES4120',
                        'name' => 'Desarrollo de Procesos Cognitivos',
                        'teacher' => 'Amada Prim',
                        'hours' => [3 => '10', 5 => '11', 7 => '11', 9 => '11', 11 => '11', 13 => '11', 15 => '11'],
                    ],
                    [
                        'code' => 'FUN4294',
                        'name' => 'Fundamentos de la Educación Primaria',
                        'teacher' => 'Benilde Figueroa',
                        'hours' => [3 => '12', 5 => '3', 7 => '3', 9 => '3', 11 => '3', 13 => '3', 15 => '3'],
                    ],
                    [
                        'code' => 'SOC4611',
                        'name' => 'Sociedad y Educación',
                        'teacher' => 'Leonardo Díaz',
                        'hours' => [2 => '8', 4 => '8', 6 => '8', 8 => '8', 10 => '8', 12 => '8', 14 => '8'],
                    ],
                    [
                        'code' => 'INV4382',
                        'name' => 'Investigación I',
                        'teacher' => 'José Peñaloza',
                        'hours' => [2 => '10', 4 => '11', 6 => '11', 8 => '11', 10 => '11', 12 => '11', 14 => '11'],
                    ],
                    [
                        'code' => 'TIC4641',
                        'name' => 'TIC I',
                        'teacher' => 'Christian Alviarez',
                        'hours' => [
                            1 => 'Virtual',
                            2 => 'Virtual',
                            3 => 'Virtual',
                            4 => 'Virtual',
                            5 => 'Virtual',
                            6 => 'Virtual',
                            7 => 'Virtual',
                            8 => 'Virtual',
                            9 => 'Virtual',
                            10 => 'Virtual',
                            11 => 'Virtual',
                            12 => 'Virtual',
                            13 => 'Virtual',
                            14 => 'Virtual',
                            15 => 'Virtual',
                            16 => 'Virtual',
                        ],
                    ],
                ],
                'distance_schedule' => 'Horario a distancia entre semana',
                'distance_time' => '7:00 pm a 9:00 pm',
            ],
        ],
    ];

    /**
     * Números romanos de los períodos académicos.
     *
     * @var array<int, string>
     */
    private const ROMAN = [
        1 => 'I',
        2 => 'II',
        3 => 'III',
        4 => 'IV',
        5 => 'V',
        6 => 'VI',
        7 => 'VII',
        8 => 'VIII',
        9 => 'IX',
        10 => 'X',
        11 => 'XI',
        12 => 'XII',
    ];

    /**
     * Etiqueta romana de un período académico.
     */
    public static function roman(int $period): string
    {
        return self::ROMAN[$period] ?? (string) $period;
    }

    /**
     * Contenido base del horario oficial, sin datos de la carrera.
     *
     * @return array<string, mixed>
     */
    public static function template(): array
    {
        $definition = self::CATALOG['EDPRI'][1];

        return [
            'weeks' => $definition['weeks'],
            'subjects' => $definition['subjects'],
            'time_slots' => array_values(self::TIME_SLOTS),
            'distance_schedule' => $definition['distance_schedule'],
            'distance_time' => $definition['distance_time'],
        ];
    }

    /**
     * Construye el horario de una carrera, período y cohorte concretos.
     *
     * Si se envían fechas de inicio y fin, las columnas se generan a partir del
     * calendario (sábados o semanas de lunes a viernes). Si no, se conserva la
     * plantilla oficial de 16 sábados.
     *
     * @param  array<int, array{position: int, code: string, name: string, teacher: string|null, modality?: string|null, dates?: array<int, string>, starts_at?: string|null, ends_at?: string|null}>|null  $subjects
     * @return array<string, mixed>
     */
    public static function build(
        string $career,
        int $period,
        string $cohort,
        ?string $schedule = null,
        ?array $subjects = null,
        ?string $startsOn = null,
        ?string $endsOn = null,
    ): array {
        if ($startsOn !== null && $endsOn !== null && $schedule !== null) {
            return self::presentRange(
                $career,
                self::roman($period),
                $cohort,
                $schedule,
                $startsOn,
                $endsOn,
                $subjects ?? [],
            );
        }

        return self::present(
            self::template(),
            $schedule,
            $career,
            self::roman($period),
            $cohort,
            $subjects === [] ? null : $subjects,
        ) ?? [];
    }

    /**
     * Construye el horario que corresponde al estudiante.
     *
     * Prioriza los horarios publicados desde la administración y, si no hay
     * ninguno para su carrera y período, usa el catálogo transcrito.
     *
     * @return array<string, mixed>|null
     */
    public static function forStudent(?string $careerCode, int $semester, ?string $schedule): ?array
    {
        $record = Schedule::query()
            ->with('career:id,name,code')
            ->whereHas('career', static fn ($query) => $query->where('code', $careerCode ?? ''))
            ->where('period', $semester)
            ->orderByDesc('cohort')
            ->orderByDesc('id')
            ->first();

        if ($record !== null && $record->career !== null) {
            return $record->toScheduleArray($schedule);
        }

        $definition = self::CATALOG[$careerCode ?? ''][$semester] ?? null;

        if ($definition === null) {
            return null;
        }

        return self::present(
            $definition,
            $schedule,
            (string) $definition['career'],
            (string) $definition['period'],
            (string) $definition['cohort'],
        );
    }

    /**
     * Sustituye los datos de la plantilla por las materias seleccionadas.
     *
     * Cada materia ocupa una franja de la plantilla y hereda su patrón de horas.
     * Si la materia no tiene docente asignado se conserva el de la plantilla.
     * Las materias de modalidad online se muestran siempre como virtuales.
     *
     * @param  array<int, array<string, mixed>>  $templateSubjects
     * @param  array<int, array{position: int, code: string, name: string, teacher: string|null, modality?: string|null}>  $selectedSubjects
     * @return array<int, array<string, mixed>>
     */
    private static function applySubjects(array $templateSubjects, array $selectedSubjects): array
    {
        $slots = [];

        foreach (array_values($templateSubjects) as $index => $subject) {
            $slots[$index + 1] = $subject;
        }

        $subjects = [];

        foreach ($selectedSubjects as $selected) {
            $position = (int) ($selected['position'] ?? 0);
            $slot = $slots[$position] ?? null;

            if ($slot === null) {
                continue;
            }

            $teacher = trim((string) ($selected['teacher'] ?? ''));
            $isOnline = ($selected['modality'] ?? null) === 'online';
            $hours = $isOnline
                ? $slot['hours']
                : array_map(
                    static fn (?string $hour): ?string => $hour === 'Virtual' ? null : $hour,
                    $slot['hours'],
                );

            $subjects[$position] = [
                'code' => (string) $selected['code'],
                'name' => (string) $selected['name'],
                'teacher' => $teacher !== '' ? $teacher : (string) $slot['teacher'],
                'hours' => $hours,
                'virtual' => $isOnline,
            ];
        }

        ksort($subjects);

        return array_values($subjects);
    }

    /**
     * Arma el horario a partir del rango de fechas elegido por la administración.
     *
     * @param  array<int, array{position: int, code: string, name: string, teacher: string|null, modality?: string|null, dates?: array<int, string>, starts_at?: string|null, ends_at?: string|null}>  $selectedSubjects
     * @return array<string, mixed>
     */
    private static function presentRange(
        string $career,
        string $period,
        string $cohort,
        string $schedule,
        string $startsOn,
        string $endsOn,
        array $selectedSubjects,
    ): array {
        $weeks = ScheduleCalendar::weeks($startsOn, $endsOn, $schedule);

        $templateSubjects = array_values(self::template()['subjects']);
        $subjects = [];
        $timeSlots = [];
        $isSaturday = $schedule === 'sabatino';

        foreach ($selectedSubjects as $selected) {
            $selectedDates = array_flip($selected['dates'] ?? []);
            $isOnline = ($selected['modality'] ?? null) === 'online';
            $startsAt = $selected['starts_at'] ?? null;
            $endsAt = $selected['ends_at'] ?? null;
            $hours = [];
            $pdfHours = [];

            foreach ($weeks as $week) {
                $weekDates = array_values(array_filter(
                    $week['dates'],
                    static fn (string $date): bool => isset($selectedDates[$date]),
                ));

                if ($weekDates === []) {
                    $hours[] = null;
                    $pdfHours[] = null;

                    continue;
                }

                if ($isOnline) {
                    $hours[] = 'Virtual';
                    $pdfHours[] = 'Virtual';

                    continue;
                }

                $timeLabel = ScheduleCalendar::timeLabel($startsAt, $endsAt);
                $hours[] = $isSaturday
                    ? $timeLabel
                    : ScheduleCalendar::daysLabel($weekDates).' · '.$timeLabel;
                $pdfHours[] = $isSaturday
                    ? ScheduleCalendar::compactTimeLabel($startsAt, $endsAt)
                    : ScheduleCalendar::compactDays($weekDates).' '.ScheduleCalendar::compactTimeLabel($startsAt, $endsAt);

                if ($timeLabel !== '') {
                    $timeSlots[$timeLabel] = [
                        'starts_at' => (string) $startsAt,
                        'ends_at' => (string) $endsAt,
                    ];
                }
            }

            $subjects[] = [
                'code' => (string) $selected['code'],
                'name' => (string) $selected['name'],
                'teacher' => trim((string) ($selected['teacher'] ?? '')) !== ''
                    ? (string) $selected['teacher']
                    : (string) ($templateSubjects[((int) $selected['position']) - 1]['teacher'] ?? ''),
                'hours' => $hours,
                'pdf_hours' => $pdfHours,
            ];
        }

        $distanceSubjects = array_map(
            static fn (array $subject): array => [
                ...$subject,
                'hours' => array_map(
                    static fn (?string $hour): ?string => $hour === 'Virtual' ? 'Virtual' : null,
                    $subject['hours'],
                ),
                'pdf_hours' => array_map(
                    static fn (?string $hour): ?string => $hour === 'Virtual' ? 'Virtual' : null,
                    $subject['pdf_hours'],
                ),
            ],
            $subjects,
        );

        return [
            'title' => 'HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO '.$cohort,
            'career' => $career,
            'cohort' => $cohort,
            'period' => $period,
            'schedule_label' => AcademicOptions::scheduleLabel($schedule),
            'weeks' => $weeks,
            'subjects' => $subjects,
            'distance_subjects' => $distanceSubjects,
            'time_slots' => ScheduleCalendar::timeSlots(array_values($timeSlots)),
            'distance_schedule' => 'Horario a distancia entre semana',
            'distance_time' => '7:00 pm a 9:00 pm',
        ];
    }

    /**
     * Arma las cuadrículas y la leyenda del horario.
     *
     * @param  array<string, mixed>  $definition
     * @param  array<int, array{position: int, code: string, name: string, teacher: string|null, modality?: string|null}>|null  $selectedSubjects
     * @return array<string, mixed>|null
     */
    private static function present(
        array $definition,
        ?string $schedule,
        string $career,
        string $period,
        string $cohort,
        ?array $selectedSubjects = null,
    ): ?array {
        $days = self::SCHEDULE_DAYS[$schedule ?? ''] ?? null;

        $weeks = array_values(array_filter(
            $definition['weeks'],
            static fn (array $week): bool => $days === null || in_array($week['weekday'], $days, true),
        ));

        if ($weeks === []) {
            return null;
        }

        $weekNumbers = array_column($weeks, 'week');

        $templateSubjects = $selectedSubjects === null
            ? $definition['subjects']
            : self::applySubjects($definition['subjects'], $selectedSubjects);

        $subjects = array_map(
            static function (array $subject) use ($weekNumbers): array {
                $isVirtual = (bool) ($subject['virtual'] ?? false);

                $hours = array_map(
                    static fn (int $week): ?string => $isVirtual
                        ? 'Virtual'
                        : (isset($subject['hours'][$week])
                            ? (string) $subject['hours'][$week]
                            : null),
                    $weekNumbers,
                );

                return [
                    'code' => $subject['code'],
                    'name' => $subject['name'],
                    'teacher' => $subject['teacher'],
                    'hours' => $hours,
                ];
            },
            $templateSubjects,
        );

        // La segunda cuadrícula del horario oficial solo registra las
        // actividades a distancia: conserva las virtuales y deja el resto vacío.
        $distanceSubjects = array_map(
            static fn (array $subject): array => [
                ...$subject,
                'hours' => array_map(
                    static fn (?string $hour): ?string => $hour === 'Virtual' ? 'Virtual' : null,
                    $subject['hours'],
                ),
            ],
            $subjects,
        );

        return [
            'title' => 'HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO '.$cohort,
            'career' => $career,
            'cohort' => $cohort,
            'period' => $period,
            'schedule_label' => $schedule !== null
                ? AcademicOptions::scheduleLabel($schedule)
                : 'Todos los días',
            'weeks' => $weeks,
            'subjects' => $subjects,
            'distance_subjects' => $distanceSubjects,
            'time_slots' => array_values(self::TIME_SLOTS),
            'distance_schedule' => $definition['distance_schedule'] ?? null,
            'distance_time' => $definition['distance_time'] ?? null,
        ];
    }
}
