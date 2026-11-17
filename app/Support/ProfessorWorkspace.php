<?php

namespace App\Support;

use App\Models\AcademicPeriod;
use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

/**
 * Datos compartidos por las páginas del portal docente.
 *
 * La carga académica (carreras, materias y estudiantes) proviene de los
 * horarios publicados y el roster de cada materia es el de la planilla de
 * evaluación. Las evaluaciones y sus notas completas solo se exponen cuando la
 * página de "Cargar notas" las necesita.
 */
final class ProfessorWorkspace
{
    /**
     * Carreras, materias y estudiantes del docente en sesión.
     *
     * Cada materia lista el cohorte completo de su carrera (estudiantes
     * activos más los ya inscritos), el mismo roster de la planilla de
     * evaluación, para que el docente vea a quienes cursan la materia aunque
     * todavía no tengan notas cargadas.
     *
     * @param  bool  $withGradeSheets  Incluye las evaluaciones y la planilla de notas.
     * @return array{
     *     profile: array{employee_code: string, department: string|null, academic_title: string|null}|null,
     *     summary: array{
     *         careers_count: int,
     *         subjects_count: int,
     *         students_count: int,
     *         pending_count: int,
     *         graded_count: int,
     *         average: float|null
     *     },
     *     careers: array<int, array<string, mixed>>,
     *     active_period: string|null
     * }
     */
    public static function overview(User $professor, bool $withGradeSheets = false): array
    {
        $profile = $professor->professorProfile()->first();

        $schedules = ProfessorAssignments::schedules($professor);

        $subjectIds = $schedules
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects->modelKeys())
            ->unique()
            ->values()
            ->all();

        $enrollments = Enrollment::query()
            ->with('academicPeriod')
            ->whereIn('subject_id', $subjectIds)
            ->orderBy('id')
            ->get()
            ->groupBy('subject_id');

        /** @var SupportCollection<string, EvaluationPlan> $plans */
        $plans = EvaluationPlan::query()
            ->where('professor_id', $professor->id)
            ->whereIn('subject_id', $subjectIds)
            ->with(['items', 'academicPeriod', 'schedule', 'subject.career'])
            ->orderBy('id')
            ->get()
            ->keyBy(static fn (EvaluationPlan $plan): string => "{$plan->subject_id}-{$plan->schedule_id}");

        /** @var SupportCollection<int, array<int, array<string, mixed>>> $rosters */
        $rosters = $plans->mapWithKeys(static fn (EvaluationPlan $plan): array => [
            $plan->id => EvaluationPlanSheet::studentRows($plan),
        ]);

        /** @var SupportCollection<int, Collection<int, User>> $cohorts */
        $cohorts = $schedules
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects->all())
            ->unique(static fn (Subject $subject): int => $subject->id)
            ->mapWithKeys(static fn (Subject $subject): array => [
                $subject->id => self::cohortStudents($subject, $enrollments),
            ]);

        $careers = $schedules
            ->groupBy('career_id')
            ->map(static function (SupportCollection $careerSchedules) use ($cohorts, $enrollments, $plans, $rosters, $withGradeSheets): array {
                /** @var Schedule $firstSchedule */
                $firstSchedule = $careerSchedules->first();
                $career = $firstSchedule->career;

                $subjects = $careerSchedules
                    ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects
                        ->map(static fn (Subject $subject): array => [
                            'schedule' => $schedule,
                            'subject' => $subject,
                        ])
                        ->all())
                    ->unique(static fn (array $row): int => $row['subject']->id)
                    ->values()
                    ->map(static function (array $row) use ($cohorts, $enrollments, $plans, $rosters, $withGradeSheets): array {
                        /** @var Schedule $schedule */
                        $schedule = $row['schedule'];
                        /** @var Subject $subject */
                        $subject = $row['subject'];
                        /** @var EvaluationPlan|null $plan */
                        $plan = $plans->get("{$subject->id}-{$schedule->id}");

                        return [
                            'id' => $subject->id,
                            'name' => $subject->name,
                            'code' => $subject->code,
                            'semester' => $subject->semester,
                            'cohort' => $schedule->cohort,
                            'schedule_id' => $schedule->id,
                            'schedule_label' => AcademicOptions::scheduleLabel($schedule->study_schedule),
                            'plan' => $plan instanceof EvaluationPlan
                                ? self::planData($plan, $withGradeSheets, $rosters->get($plan->id, []))
                                : null,
                            'students' => self::subjectStudents(
                                $plan,
                                $plan instanceof EvaluationPlan ? $rosters->get($plan->id, []) : [],
                                $cohorts->get($subject->id, new Collection),
                                $enrollments->get($subject->id, new Collection),
                            ),
                        ];
                    })
                    ->values();

                $students = $subjects
                    ->flatMap(static fn (array $row): array => $row['students']->pluck('student_id')->all())
                    ->unique();

                return [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'students_count' => $students->count(),
                    'subjects' => $subjects,
                ];
            })
            ->values();

        $studentRows = $careers
            ->flatMap(static fn (array $career): array => $career['subjects']->all())
            ->flatMap(static fn (array $subject): array => $subject['students']->all());

        $scoredRows = $studentRows->filter(static fn (array $row): bool => $row['grade'] !== null);
        $pendingCount = $studentRows->count() - $scoredRows->count();
        $gradedCount = $scoredRows->count();

        $completedRows = $studentRows->filter(
            static fn (array $row): bool => in_array($row['status'], ['aprobado', 'reprobado'], true),
        );
        $average = $completedRows->isEmpty() ? null : $completedRows->avg('grade');

        return [
            'profile' => $profile !== null ? [
                'employee_code' => $profile->employee_code,
                'department' => $profile->department,
                'academic_title' => $profile->academic_title,
            ] : null,
            'summary' => [
                'careers_count' => $careers->count(),
                'subjects_count' => $careers->sum(
                    static fn (array $career): int => $career['subjects']->count(),
                ),
                'students_count' => $careers->sum('students_count'),
                'pending_count' => $pendingCount,
                'graded_count' => $gradedCount,
                'average' => $average !== null ? round((float) $average, 1) : null,
            ],
            'careers' => $careers->all(),
            'active_period' => AcademicPeriod::query()->where('is_active', true)->value('name'),
        ];
    }

    /**
     * Estudiantes activos de la carrera de la materia y los ya inscritos en ella.
     *
     * @param  SupportCollection<int, Collection<int, Enrollment>>  $enrollments
     * @return Collection<int, User>
     */
    private static function cohortStudents(Subject $subject, SupportCollection $enrollments): Collection
    {
        $enrolledIds = $enrollments
            ->get($subject->id, new Collection)
            ->pluck('student_id')
            ->all();

        return User::query()
            ->where(static function (Builder $query) use ($subject, $enrolledIds): void {
                $query->whereHas('studentProfile', static function (Builder $profile) use ($subject): void {
                    $profile->where('career_id', $subject->career_id)->where('status', 'activo');
                })->orWhereIn('id', $enrolledIds);
            })
            ->with('studentProfile')
            ->orderBy('name')
            ->get();
    }

    /**
     * Filas de estudiantes de una materia para la página "Estudiantes".
     *
     * Con plan de evaluación se usa la planilla oficial, de modo que la nota
     * definitiva sale solo de las notas cargadas. Sin plan se listan los
     * estudiantes del cohorte con "Sin nota" a la espera de calificaciones.
     *
     * @param  array<int, array<string, mixed>>  $rosterRows
     * @param  Collection<int, User>  $cohort
     * @param  Collection<int, Enrollment>  $subjectEnrollments
     * @return SupportCollection<int, array<string, mixed>>
     */
    private static function subjectStudents(
        ?EvaluationPlan $plan,
        array $rosterRows,
        Collection $cohort,
        Collection $subjectEnrollments,
    ): SupportCollection {
        if ($plan instanceof EvaluationPlan) {
            return collect($rosterRows)
                ->map(static fn (array $row): array => self::rosterRow($row, $plan))
                ->values();
        }

        $enrollments = $subjectEnrollments->keyBy('student_id');

        return $cohort
            ->map(static function (User $student) use ($enrollments): array {
                /** @var Enrollment|null $enrollment */
                $enrollment = $enrollments->get($student->id);

                return [
                    'enrollment_id' => $enrollment?->id,
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_code' => $student->studentProfile?->student_code,
                    'period' => $enrollment?->academicPeriod?->name,
                    'grade' => null,
                    'graded_items' => 0,
                    'total_items' => 0,
                    'status' => 'sin_nota',
                    'status_label' => 'Cursando',
                    'status_tone' => 'slate',
                ];
            })
            ->values();
    }

    /**
     * Fila de la página "Estudiantes" a partir de la planilla del plan.
     *
     * La nota es la definitiva acumulada del plan y el estado solo resuelve
     * Aprobado o Reprobado cuando el plan está completo y todas sus
     * evaluaciones tienen nota.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function rosterRow(array $row, EvaluationPlan $plan): array
    {
        $graded = count(array_filter($row['scores'], static fn ($score): bool => $score !== null));
        $total = $plan->items->count();

        [$status, $statusLabel, $statusTone] = match (true) {
            $graded === 0 => ['sin_nota', 'Cursando', 'slate'],
            $graded < $total => ['en_curso', 'Faltan notas', 'amber'],
            $row['approved'] === null => ['plan_incompleto', 'Plan incompleto', 'amber'],
            $row['approved'] === true => ['aprobado', 'Aprobado', 'green'],
            default => ['reprobado', 'Reprobado', 'red'],
        };

        return [
            'enrollment_id' => $row['enrollment_id'],
            'student_id' => $row['student_id'],
            'student_name' => $row['student_name'],
            'student_code' => $row['student_code'],
            'period' => $plan->academicPeriod?->name,
            'grade' => $row['definitive_ten'],
            'graded_items' => $graded,
            'total_items' => $total,
            'status' => $status,
            'status_label' => $statusLabel,
            'status_tone' => $statusTone,
        ];
    }

    /**
     * Plan de evaluación de una materia con la planilla de notas opcional.
     *
     * @param  array<int, array<string, mixed>>  $rosterRows
     * @return array{
     *     id: int,
     *     period: string|null,
     *     total_weight: int,
     *     remaining_weight: int,
     *     is_complete: bool,
     *     items?: array<int, array{id: int, position: int, title: string, weight: int, scheduled_on: string}>,
     *     students?: array<int, array<string, mixed>>
     * }
     */
    private static function planData(EvaluationPlan $plan, bool $withGradeSheets, array $rosterRows): array
    {
        $totalWeight = $plan->totalWeight();

        $data = [
            'id' => $plan->id,
            'period' => $plan->academicPeriod?->name,
            'total_weight' => $totalWeight,
            'remaining_weight' => EvaluationPlanGrading::missingWeight($totalWeight),
            'is_complete' => $totalWeight === EvaluationPlanGrading::TOTAL_WEIGHT,
        ];

        if (! $withGradeSheets) {
            return $data;
        }

        return $data + [
            'items' => $plan->items
                ->values()
                ->map(static fn (EvaluationPlanItem $item): array => [
                    'id' => $item->id,
                    'position' => $item->position,
                    'title' => $item->title,
                    'weight' => $item->weight,
                    'scheduled_on' => $item->scheduled_on->format('d/m/Y'),
                ])
                ->all(),
            'students' => $rosterRows,
        ];
    }
}
