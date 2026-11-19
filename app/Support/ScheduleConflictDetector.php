<?php

namespace App\Support;

use App\Models\Subject;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Detecta solapamientos de horarios antes de publicar o actualizar un horario.
 *
 * Se comparan las fechas y franjas horarias de cada materia con el resto de
 * materias del formulario y con los horarios ya publicados. Se rechazan los
 * choques por aula, por docente y, dentro de un mismo grupo (carrera, período,
 * cohorte, tipo de horario y modalidad), por materias simultáneas.
 */
final class ScheduleConflictDetector
{
    /**
     * @param  int|null  $scheduleId  horario que se está editando (se ignora)
     */
    public function __construct(private readonly ?int $scheduleId = null) {}

    /**
     * Devuelve los conflictos encontrados indexados por la fila del formulario.
     *
     * @param  array<int, array<string, mixed>>  $subjects
     * @return array<int, string>
     */
    public function detect(
        array $subjects,
        int $careerId,
        int $period,
        string $cohort,
        string $studySchedule,
        string $modality,
    ): array {
        $candidates = $this->candidateIntervals($subjects);
        $existing = $this->existingIntervals();
        $subjectNames = $this->subjectNames(
            array_merge(
                collect($subjects)->pluck('subject_id')->map(static fn ($id): int => (int) $id)->all(),
                $existing->pluck('subject_id')->map(static fn ($id): int => (int) $id)->all(),
            ),
        );
        $group = compact('careerId', 'period', 'cohort', 'studySchedule', 'modality');
        $errors = [];

        foreach ($candidates as $index => $candidate) {
            foreach ($candidates as $otherIndex => $other) {
                if ($index >= $otherIndex) {
                    continue;
                }

                foreach ($candidate['intervals'] as $interval) {
                    foreach ($other['intervals'] as $otherInterval) {
                        if (! $this->overlaps($interval, $otherInterval)) {
                            continue;
                        }

                        $errors[$index] ??= sprintf(
                            'Las materias %s y %s se solapan el %s de %s a %s.',
                            $subjectNames[$candidate['subject_id']] ?? 'seleccionada',
                            $subjectNames[$other['subject_id']] ?? 'seleccionada',
                            $this->dateLabel($interval['date']),
                            $interval['starts_at'],
                            $interval['ends_at'],
                        );
                    }
                }
            }

            foreach ($existing as $entry) {
                foreach ($candidate['intervals'] as $interval) {
                    foreach ($entry['intervals'] as $otherInterval) {
                        if (! $this->overlaps($interval, $otherInterval)) {
                            continue;
                        }

                        $message = $this->message($candidate, $interval, $entry, $otherInterval, $subjectNames, $group);

                        if ($message !== null) {
                            $errors[$index] ??= $message;
                        }
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Convierte las filas del formulario en intervalos por fecha.
     *
     * @param  array<int, array<string, mixed>>  $subjects
     * @return array<int, array<string, mixed>>
     */
    private function candidateIntervals(array $subjects): array
    {
        $rows = [];

        foreach ($subjects as $index => $subject) {
            $dates = is_array($subject['dates'] ?? null) ? $subject['dates'] : [];
            $dateTimes = is_array($subject['date_times'] ?? null) ? $subject['date_times'] : [];
            $professorId = $subject['professor_id'] ?? null;
            $professorId = $professorId === null || $professorId === '' ? null : (int) $professorId;
            $classroomId = $subject['classroom_id'] ?? null;
            $classroomId = $classroomId === null || $classroomId === '' ? null : (int) $classroomId;

            $rows[$index] = [
                'subject_id' => (int) ($subject['subject_id'] ?? 0),
                'professor_id' => $professorId,
                'teacher_name' => mb_strtolower(trim((string) ($subject['teacher_name'] ?? ''))),
                'classroom_id' => $classroomId,
                'intervals' => $this->intervals($dates, $dateTimes),
            ];
        }

        return $rows;
    }

    /**
     * Intervalos de los horarios ya publicados, excepto el que se está editando.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function existingIntervals(): Collection
    {
        $scheduleId = $this->scheduleId;

        return DB::table('schedule_subjects')
            ->join('schedules', 'schedules.id', '=', 'schedule_subjects.schedule_id')
            ->select([
                'schedule_subjects.schedule_id',
                'schedule_subjects.subject_id',
                'schedule_subjects.professor_id',
                'schedule_subjects.teacher_name',
                'schedule_subjects.classroom_id',
                'schedule_subjects.dates',
                'schedule_subjects.date_times',
                'schedule_subjects.starts_at',
                'schedule_subjects.ends_at',
                'schedules.career_id',
                'schedules.period',
                'schedules.cohort',
                'schedules.study_schedule',
                'schedules.modality',
            ])
            ->when($scheduleId !== null, static fn ($query) => $query
                ->where('schedule_subjects.schedule_id', '!=', $scheduleId))
            ->get()
            ->map(static function (object $row): array {
                $dates = json_decode((string) $row->dates, true);
                $dateTimes = json_decode((string) $row->date_times, true);

                return [
                    'schedule_id' => (int) $row->schedule_id,
                    'subject_id' => (int) $row->subject_id,
                    'professor_id' => $row->professor_id !== null ? (int) $row->professor_id : null,
                    'teacher_name' => mb_strtolower(trim((string) $row->teacher_name)),
                    'classroom_id' => $row->classroom_id !== null ? (int) $row->classroom_id : null,
                    'career_id' => (int) $row->career_id,
                    'period' => (int) $row->period,
                    'cohort' => (string) $row->cohort,
                    'study_schedule' => (string) $row->study_schedule,
                    'modality' => (string) $row->modality,
                    'intervals' => self::intervalsFromRow($dates, $dateTimes, $row),
                ];
            });
    }

    /**
     * @return array<int, array{date: string, starts_at: string, ends_at: string}>
     */
    private static function intervalsFromRow(mixed $dates, mixed $dateTimes, object $row): array
    {
        $dates = is_array($dates) ? $dates : [];
        $dateTimes = is_array($dateTimes) ? $dateTimes : [];

        if ($dateTimes === [] && $row->starts_at !== null && $row->ends_at !== null) {
            foreach ($dates as $date) {
                $dateTimes[$date] = [
                    'starts_at' => substr((string) $row->starts_at, 0, 5),
                    'ends_at' => substr((string) $row->ends_at, 0, 5),
                ];
            }
        }

        return self::intervals($dates, $dateTimes);
    }

    /**
     * @param  array<int, mixed>  $dates
     * @param  array<string, mixed>  $dateTimes
     * @return array<int, array{date: string, starts_at: string, ends_at: string}>
     */
    private static function intervals(array $dates, array $dateTimes): array
    {
        $intervals = [];

        foreach ($dates as $date) {
            if (! is_string($date) || ! isset($dateTimes[$date]) || ! is_array($dateTimes[$date])) {
                continue;
            }

            $startsAt = substr((string) ($dateTimes[$date]['starts_at'] ?? ''), 0, 5);
            $endsAt = substr((string) ($dateTimes[$date]['ends_at'] ?? ''), 0, 5);

            if ($startsAt === '' || $endsAt === '' || $endsAt <= $startsAt) {
                continue;
            }

            $intervals[] = [
                'date' => $date,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ];
        }

        return $intervals;
    }

    /**
     * @param  array{date: string, starts_at: string, ends_at: string}  $first
     * @param  array{date: string, starts_at: string, ends_at: string}  $second
     */
    private function overlaps(array $first, array $second): bool
    {
        return $first['date'] === $second['date']
            && $first['starts_at'] < $second['ends_at']
            && $second['starts_at'] < $first['ends_at'];
    }

    /**
     * @param  array<string, mixed>  $candidate
     * @param  array{date: string, starts_at: string, ends_at: string}  $interval
     * @param  array<string, mixed>  $entry
     * @param  array{date: string, starts_at: string, ends_at: string}  $otherInterval
     * @param  array<int, string>  $subjectNames
     * @param  array<string, mixed>  $group
     */
    private function message(
        array $candidate,
        array $interval,
        array $entry,
        array $otherInterval,
        array $subjectNames,
        array $group,
    ): ?string {
        $otherSubject = $subjectNames[$entry['subject_id']] ?? 'otra materia';
        $dateLabel = $this->dateLabel($interval['date']);
        $time = $interval['starts_at'].' a '.$interval['ends_at'];

        if ($candidate['classroom_id'] !== null && $candidate['classroom_id'] === $entry['classroom_id']) {
            return sprintf('El aula ya está ocupada por %s el %s de %s.', $otherSubject, $dateLabel, $time);
        }

        $sameProfessor = $candidate['professor_id'] !== null
            ? $candidate['professor_id'] === $entry['professor_id']
            : $candidate['teacher_name'] !== ''
                && $candidate['teacher_name'] === $entry['teacher_name'];

        if ($sameProfessor) {
            return sprintf('El docente ya imparte %s el %s de %s.', $otherSubject, $dateLabel, $time);
        }

        $sameGroup = $entry['career_id'] === $group['careerId']
            && $entry['period'] === $group['period']
            && $entry['cohort'] === $group['cohort']
            && $entry['study_schedule'] === $group['studySchedule']
            && $entry['modality'] === $group['modality'];

        if ($sameGroup) {
            return sprintf('%s y %s se solapan el %s de %s.', $subjectNames[$candidate['subject_id']] ?? 'La materia', $otherSubject, $dateLabel, $time);
        }

        return null;
    }

    /**
     * @param  array<int, int>  $ids
     * @return array<int, string>
     */
    private function subjectNames(array $ids): array
    {
        $ids = array_values(array_unique(array_filter($ids)));

        if ($ids === []) {
            return [];
        }

        return Subject::query()
            ->whereKey($ids)
            ->get(['id', 'name'])
            ->mapWithKeys(static fn (Subject $subject): array => [$subject->id => $subject->name])
            ->all();
    }

    private function dateLabel(string $date): string
    {
        $parsed = Carbon::createFromFormat('Y-m-d', $date);

        return $parsed === false ? $date : $parsed->format('d/m/Y');
    }
}
