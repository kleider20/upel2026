<?php

namespace App\Support;

use App\Models\AcademicPeriod;
use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

/**
 * Datos compartidos por las páginas del portal docente.
 *
 * La carga académica (carreras, materias y estudiantes) proviene de los
 * horarios publicados. La planilla de notas del plan de evaluación solo se
 * arma cuando la página de "Cargar notas" la necesita.
 */
final class ProfessorWorkspace
{
    /**
     * Carreras, materias y estudiantes del docente en sesión.
     *
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
            ->with(['student.studentProfile', 'academicPeriod'])
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

        $careers = $schedules
            ->groupBy('career_id')
            ->map(static function (SupportCollection $careerSchedules) use ($enrollments, $plans, $withGradeSheets): array {
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
                    ->values();

                $students = $subjects
                    ->flatMap(static fn (array $row): array => $enrollments
                        ->get($row['subject']->id, new Collection)
                        ->pluck('student')
                        ->all())
                    ->filter()
                    ->unique('id');

                return [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'students_count' => $students->count(),
                    'subjects' => $subjects
                        ->map(static function (array $row) use ($enrollments, $plans, $withGradeSheets): array {
                            /** @var Schedule $schedule */
                            $schedule = $row['schedule'];
                            /** @var Subject $subject */
                            $subject = $row['subject'];
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
                                    ? self::planData($plan, $withGradeSheets)
                                    : null,
                                'students' => $enrollments
                                    ->get($subject->id, new Collection)
                                    ->map(self::enrollmentData(...))
                                    ->values(),
                            ];
                        })
                        ->values(),
                ];
            })
            ->values();

        $allEnrollments = $enrollments->flatten(1);
        $graded = $allEnrollments->whereNotNull('final_grade');
        $average = $graded->avg('final_grade');

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
                'pending_count' => $allEnrollments->whereNull('final_grade')->count(),
                'graded_count' => $graded->count(),
                'average' => $average !== null ? round((float) $average, 1) : null,
            ],
            'careers' => $careers->all(),
            'active_period' => AcademicPeriod::query()->where('is_active', true)->value('name'),
        ];
    }

    /**
     * Plan de evaluación de una materia con la planilla de notas opcional.
     *
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
    private static function planData(EvaluationPlan $plan, bool $withGradeSheets): array
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
            'students' => EvaluationPlanSheet::studentRows($plan),
        ];
    }

    /**
     * @return array{
     *     enrollment_id: int,
     *     student_id: int,
     *     student_name: string,
     *     student_code: string|null,
     *     period: string,
     *     grade: float|null,
     *     status: string,
     *     status_label: string,
     *     status_tone: string
     * }
     */
    private static function enrollmentData(Enrollment $enrollment): array
    {
        return [
            'enrollment_id' => $enrollment->id,
            'student_id' => $enrollment->student_id,
            'student_name' => $enrollment->student->name,
            'student_code' => $enrollment->student->studentProfile?->student_code,
            'period' => $enrollment->academicPeriod->name,
            'grade' => $enrollment->final_grade !== null
                ? (float) $enrollment->final_grade
                : null,
            'status' => $enrollment->status,
            'status_label' => $enrollment->statusLabel(),
            'status_tone' => $enrollment->statusTone(),
        ];
    }
}
