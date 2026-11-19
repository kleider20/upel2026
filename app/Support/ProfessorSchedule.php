<?php

namespace App\Support;

use App\Models\Classroom;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Horario del docente a partir de los horarios publicados.
 */
final class ProfessorSchedule
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function overview(User $professor): array
    {
        $schedules = ProfessorAssignments::schedules($professor);
        $classroomIds = $schedules
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects
                ->pluck('pivot.classroom_id')
                ->filter()
                ->all())
            ->unique()
            ->values()
            ->all();
        $classrooms = $classroomIds === []
            ? new Collection
            : Classroom::query()->whereKey($classroomIds)->get()->keyBy('id');

        return $schedules
            ->map(static function (Schedule $schedule) use ($classrooms): array {
                return [
                    'id' => $schedule->id,
                    'career' => $schedule->career->name,
                    'career_code' => $schedule->career->code,
                    'period' => $schedule->period,
                    'period_label' => $schedule->periodLabel(),
                    'cohort' => $schedule->cohort,
                    'study_schedule_label' => AcademicOptions::scheduleLabel($schedule->study_schedule),
                    'modality_label' => AcademicOptions::modalityLabel($schedule->modality),
                    'subjects' => $schedule->subjects
                        ->map(static function (Subject $subject) use ($classrooms): array {
                            $dates = $subject->pivot->dates;
                            $dateTimes = $subject->pivot->date_times;

                            if (is_string($dates)) {
                                $dates = json_decode($dates, true);
                            }

                            if (is_string($dateTimes)) {
                                $dateTimes = json_decode($dateTimes, true);
                            }

                            $classroomId = $subject->pivot->classroom_id;
                            $sessions = [];

                            foreach (is_array($dates) ? $dates : [] as $date) {
                                if (! is_string($date) || ! is_array($dateTimes ?? null) || ! isset($dateTimes[$date])) {
                                    continue;
                                }

                                $time = $dateTimes[$date];

                                if (! is_array($time)) {
                                    continue;
                                }

                                $sessions[] = [
                                    'date' => $date,
                                    'label' => Carbon::createFromFormat('Y-m-d', $date)?->format('d/m/Y') ?? $date,
                                    'weekday' => Carbon::createFromFormat('Y-m-d', $date)?->translatedFormat('l') ?? '',
                                    'starts_at' => substr((string) ($time['starts_at'] ?? ''), 0, 5),
                                    'ends_at' => substr((string) ($time['ends_at'] ?? ''), 0, 5),
                                ];
                            }

                            usort($sessions, static fn (array $a, array $b): int => $a['date'] <=> $b['date']);

                            return [
                                'id' => $subject->id,
                                'code' => $subject->code,
                                'name' => $subject->name,
                                'classroom' => $classroomId !== null
                                    ? $classrooms->get((int) $classroomId)?->label()
                                    : null,
                                'sessions' => $sessions,
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Eventos listos para exportar a iCalendar.
     *
     * @return array<int, array{uid: string, title: string, starts_at: Carbon, ends_at: Carbon, location: string|null, description: string}>
     */
    public static function events(User $professor): array
    {
        $events = [];

        foreach (ProfessorAssignments::schedules($professor) as $schedule) {
            foreach ($schedule->subjects as $subject) {
                $dates = $subject->pivot->dates;
                $dateTimes = $subject->pivot->date_times;

                if (is_string($dates)) {
                    $dates = json_decode($dates, true);
                }

                if (is_string($dateTimes)) {
                    $dateTimes = json_decode($dateTimes, true);
                }

                $classroomId = $subject->pivot->classroom_id;
                $classroom = $classroomId !== null
                    ? Classroom::query()->find((int) $classroomId)
                    : null;

                foreach (is_array($dates) ? $dates : [] as $date) {
                    if (! is_string($date) || ! is_array($dateTimes ?? null) || ! isset($dateTimes[$date]) || ! is_array($dateTimes[$date])) {
                        continue;
                    }

                    $startsAt = substr((string) ($dateTimes[$date]['starts_at'] ?? ''), 0, 5);
                    $endsAt = substr((string) ($dateTimes[$date]['ends_at'] ?? ''), 0, 5);

                    if ($startsAt === '' || $endsAt === '' || $endsAt <= $startsAt) {
                        continue;
                    }

                    $starts = Carbon::createFromFormat('Y-m-d H:i', $date.' '.$startsAt, 'America/Caracas');
                    $ends = Carbon::createFromFormat('Y-m-d H:i', $date.' '.$endsAt, 'America/Caracas');

                    if ($starts === false || $ends === false) {
                        continue;
                    }

                    $events[] = [
                        'uid' => sprintf(
                            'profesor-%d-horario-%d-materia-%d-%s@upel.edu.ve',
                            $professor->id,
                            $schedule->id,
                            $subject->id,
                            md5($date.$startsAt),
                        ),
                        'title' => $subject->name.' · '.$schedule->career->code.' '.$schedule->cohort,
                        'starts_at' => $starts,
                        'ends_at' => $ends,
                        'location' => $classroom?->label(),
                        'description' => 'Docente: '.$professor->name,
                    ];
                }
            }
        }

        return $events;
    }
}
