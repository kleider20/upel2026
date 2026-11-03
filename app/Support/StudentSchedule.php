<?php

namespace App\Support;

/**
 * Horarios de actividades presenciales por carrera y período académico.
 *
 * Los datos se transcriben de los horarios publicados por la Coordinación de
 * Docencia del Instituto de Mejoramiento Profesional del Magisterio. Cada
 * semana se asocia a un día de la semana para poder filtrar el horario según
 * la modalidad de estudio que el estudiante eligió en su preinscripción.
 */
final class StudentSchedule
{
    /**
     * Franjas horarias de las actividades presenciales.
     *
     * @var array<int, string>
     */
    private const TIME_SLOTS = [
        1 => '1.- 8:00 am a 11:00 am',
        2 => '2.- 11:30 am a 2:30 pm',
        3 => '3.- 3:00 pm a 6:00 pm',
    ];

    /**
     * Etiqueta de la hora de inicio que se muestra en cada celda.
     *
     * @var array<string, string>
     */
    private const HOURS = [
        '8' => '8:00 am',
        '10' => '10:00 am',
        '11' => '11:00 am',
        '12' => '12:00 pm',
        '3' => '3:00 pm',
    ];

    /**
     * Horarios disponibles por código de carrera y período.
     *
     * @var array<string, array<int, array<string, mixed>>>
     */
    private const CATALOG = [
        'EDPRI' => [
            1 => [
                'title' => 'Horarios de actividades presenciales del período académico 2025-II',
                'career' => 'Educación Primaria',
                'cohort' => '2025-II',
                'period' => 'I',
                'weeks' => [
                    ['week' => 1, 'month' => 'Octubre', 'date' => '18/10', 'weekday' => 'Sábado'],
                    ['week' => 2, 'month' => 'Octubre', 'date' => '25/10', 'weekday' => 'Sábado'],
                    ['week' => 3, 'month' => 'Noviembre', 'date' => '01/11', 'weekday' => 'Sábado'],
                    ['week' => 4, 'month' => 'Noviembre', 'date' => '08/11', 'weekday' => 'Sábado'],
                    ['week' => 5, 'month' => 'Noviembre', 'date' => '15/11', 'weekday' => 'Sábado'],
                    ['week' => 6, 'month' => 'Noviembre', 'date' => '22/11', 'weekday' => 'Sábado'],
                    ['week' => 7, 'month' => 'Noviembre', 'date' => '29/11', 'weekday' => 'Sábado'],
                    ['week' => 8, 'month' => 'Dic', 'date' => '06/12', 'weekday' => 'Sábado'],
                    ['week' => 9, 'month' => 'Enero', 'date' => '10/12', 'weekday' => 'Miércoles'],
                    ['week' => 10, 'month' => 'Enero', 'date' => '17/12', 'weekday' => 'Miércoles'],
                    ['week' => 11, 'month' => 'Enero', 'date' => '24/12', 'weekday' => 'Miércoles'],
                    ['week' => 12, 'month' => 'Enero', 'date' => '31/12', 'weekday' => 'Miércoles'],
                    ['week' => 13, 'month' => 'Febrero', 'date' => '07/01', 'weekday' => 'Miércoles'],
                    ['week' => 14, 'month' => 'Febrero', 'date' => '14/01', 'weekday' => 'Miércoles'],
                    ['week' => 15, 'month' => 'Febrero', 'date' => '21/01', 'weekday' => 'Miércoles'],
                    ['week' => 16, 'month' => 'Febrero', 'date' => '28/01', 'weekday' => 'Miércoles'],
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
                        'hours' => [2 => '12', 4 => '3', 6 => '3', 8 => '3', 9 => '3', 11 => '3', 13 => '3', 15 => '3'],
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
                        'hours' => [2 => '8', 4 => '8', 6 => '8', 8 => '8', 10 => '8', 12 => '8', 14 => '8', 16 => '8'],
                    ],
                    [
                        'code' => 'INV4382',
                        'name' => 'Investigación I',
                        'teacher' => 'José Peñaloza',
                        'hours' => [2 => '10', 4 => '11', 6 => '11', 8 => '11', 10 => '11', 12 => '11', 14 => '11', 16 => '11'],
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
                'distance_schedule' => 'Horario a distancia entre semana: 7:00 pm a 9:00 pm',
            ],
        ],
    ];

    /**
     * Construye el horario que corresponde al estudiante.
     *
     * @return array<string, mixed>|null
     */
    public static function forStudent(?string $careerCode, int $semester, ?string $schedule): ?array
    {
        $definition = self::CATALOG[$careerCode ?? ''][$semester] ?? null;

        if ($definition === null) {
            return null;
        }

        $weeks = $definition['weeks'];
        $weekNumbers = array_column($weeks, 'week');

        $subjects = array_map(
            static function (array $subject) use ($weekNumbers): array {
                $hours = array_map(
                    static fn (int $week): ?string => isset($subject['hours'][$week])
                        ? (self::HOURS[$subject['hours'][$week]] ?? $subject['hours'][$week])
                        : null,
                    $weekNumbers,
                );

                return [
                    'code' => $subject['code'],
                    'name' => $subject['name'],
                    'teacher' => $subject['teacher'],
                    'hours' => $hours,
                ];
            },
            $definition['subjects'],
        );

        return [
            'title' => $definition['title'],
            'career' => $definition['career'],
            'cohort' => $definition['cohort'],
            'period' => $definition['period'],
            'schedule_label' => $schedule !== null
                ? AcademicOptions::scheduleLabel($schedule)
                : 'Todos los días',
            'weeks' => $weeks,
            'subjects' => $subjects,
            'time_slots' => array_values(self::TIME_SLOTS),
            'distance_schedule' => $definition['distance_schedule'],
        ];
    }
}
