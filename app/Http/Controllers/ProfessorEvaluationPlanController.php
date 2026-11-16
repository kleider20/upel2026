<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEvaluationPlanRequest;
use App\Models\AcademicPeriod;
use App\Models\EvaluationPlan;
use App\Models\Schedule;
use App\Models\Subject;
use App\Support\AcademicOptions;
use App\Support\EvaluationPlanDates;
use App\Support\EvaluationPlanGrading;
use App\Support\EvaluationPlanSheet;
use App\Support\ProfessorAssignments;
use App\Support\StudentSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorEvaluationPlanController extends Controller
{
    /**
     * Lista las materias que el docente imparte según los horarios publicados,
     * con el estado del plan de evaluación de cada una.
     */
    public function index(Request $request): Response
    {
        $professor = $request->user();

        abort_if($professor === null, 403);

        $schedules = ProfessorAssignments::schedules($professor);

        $subjectIds = $schedules
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects->modelKeys())
            ->unique()
            ->values()
            ->all();

        /** @var Collection<string, EvaluationPlan> $plans */
        $plans = EvaluationPlan::query()
            ->where('professor_id', $professor->id)
            ->whereIn('subject_id', $subjectIds)
            ->with(['academicPeriod', 'items'])
            ->orderBy('id')
            ->get()
            ->keyBy(static fn (EvaluationPlan $plan): string => "{$plan->subject_id}-{$plan->schedule_id}");

        $rows = $schedules
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects
                ->map(static function (Subject $subject) use ($schedule, $plans): array {
                    $plan = $plans->get("{$subject->id}-{$schedule->id}");
                    $totalWeight = $plan instanceof EvaluationPlan
                        ? (int) $plan->items->sum('weight')
                        : 0;

                    return [
                        'key' => "{$subject->id}-{$schedule->id}",
                        'plan_id' => $plan?->id,
                        'subject_id' => $subject->id,
                        'schedule_id' => $schedule->id,
                        'career' => $schedule->career?->name,
                        'career_code' => $schedule->career?->code,
                        'program' => $schedule->career?->programTypeLabel(),
                        'cohort' => $schedule->cohort,
                        'subject' => $subject->name,
                        'subject_code' => $subject->code,
                        'course' => $subject->courseLabel(),
                        'period' => $plan instanceof EvaluationPlan
                            ? $plan->academicPeriod?->name
                            : ($schedule->period ? StudentSchedule::roman($schedule->period).' período' : null),
                        'modality_label' => AcademicOptions::modalityLabel($subject->modality),
                        'items_count' => $plan?->items->count() ?? 0,
                        'total_weight' => $totalWeight,
                        'remaining_weight' => EvaluationPlanGrading::missingWeight($totalWeight),
                        'is_complete' => $totalWeight === EvaluationPlanGrading::TOTAL_WEIGHT,
                        'students_count' => $plan instanceof EvaluationPlan
                            ? count(EvaluationPlanSheet::studentRows($plan))
                            : 0,
                    ];
                })
                ->all())
            ->values()
            ->all();

        return Inertia::render('professor/plans/index', [
            'subjects' => $rows,
            'summary' => [
                'subjects_count' => count($rows),
                'plans_count' => collect($rows)->whereNotNull('plan_id')->count(),
                'complete_count' => collect($rows)->where('is_complete', true)->count(),
                'evaluations_count' => collect($rows)->sum('items_count'),
            ],
            'limits' => EvaluationPlanGrading::limits(),
        ]);
    }

    /**
     * Muestra el formulario para elegir carrera, cohorte y materia del plan.
     *
     * Solo aparecen las materias que los horarios publicados asignan al docente.
     */
    public function create(Request $request): Response
    {
        $professor = $request->user();

        abort_if($professor === null, 403);

        $schedules = ProfessorAssignments::schedules($professor);

        $careers = $schedules
            ->groupBy('career_id')
            ->map(static function (Collection $careerSchedules): array {
                /** @var Schedule $firstSchedule */
                $firstSchedule = $careerSchedules->first();
                $career = $firstSchedule->career;

                $subjects = $careerSchedules
                    ->flatMap(static fn (Schedule $schedule): Collection => $schedule->subjects)
                    ->unique(static fn (Subject $subject): int => $subject->id)
                    ->values();

                $cohorts = $careerSchedules
                    ->map(static fn (Schedule $schedule): array => [
                        'schedule_id' => $schedule->id,
                        'cohort' => $schedule->cohort,
                        'period' => $schedule->period,
                        'period_label' => StudentSchedule::roman($schedule->period),
                        'label' => sprintf(
                            '%s · %s periodo · %s',
                            $schedule->cohort,
                            StudentSchedule::roman($schedule->period),
                            AcademicOptions::scheduleLabel($schedule->study_schedule),
                        ),
                        'study_schedule_label' => AcademicOptions::scheduleLabel($schedule->study_schedule),
                        'starts_on' => $schedule->starts_on?->format('d/m/Y'),
                        'ends_on' => $schedule->ends_on?->format('d/m/Y'),
                        'modality_label' => AcademicOptions::modalityLabel($schedule->modality),
                        'subject_dates' => $schedule->subjects
                            ->mapWithKeys(static fn (Subject $scheduled): array => [
                                $scheduled->id => EvaluationPlanDates::options($scheduled->pivot->dates),
                            ])
                            ->all(),
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'program' => $career->programTypeLabel(),
                    'modality_label' => $career->modalityLabel(),
                    'cohorts' => $cohorts,
                    'subjects' => $subjects
                        ->map(static fn (Subject $subject): array => [
                            'id' => $subject->id,
                            'code' => $subject->code,
                            'name' => $subject->name,
                            'course' => $subject->courseLabel(),
                            'semester' => $subject->semester,
                            'modality' => $subject->modality,
                            'modality_label' => AcademicOptions::modalityLabel($subject->modality),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        $activePeriod = AcademicPeriod::query()->where('is_active', true)->first();

        $requestedSubjectId = $request->integer('subject_id');
        $requestedScheduleId = $request->integer('schedule_id');

        $subjectIsAssigned = collect($careers)->contains(
            static fn (array $career): bool => collect($career['subjects'])->contains(
                static fn (array $subject): bool => $subject['id'] === $requestedSubjectId,
            ),
        );
        $scheduleIsAssigned = collect($careers)->contains(
            static fn (array $career): bool => collect($career['cohorts'])->contains(
                static fn (array $cohort): bool => $cohort['schedule_id'] === $requestedScheduleId,
            ),
        );

        $requestedSchedule = $scheduleIsAssigned
            ? $schedules->firstWhere('id', $requestedScheduleId)
            : null;

        $suggestedPeriodId = $requestedSchedule !== null
            ? AcademicPeriod::query()->where('name', $requestedSchedule->cohort)->value('id')
            : null;

        return Inertia::render('professor/plans/create', [
            'careers' => $careers,
            'periods' => AcademicPeriod::query()
                ->orderByDesc('starts_at')
                ->get(['id', 'name', 'is_active'])
                ->map(static fn (AcademicPeriod $period): array => [
                    'id' => $period->id,
                    'name' => $period->name,
                    'is_active' => (bool) $period->is_active,
                ])
                ->all(),
            'defaults' => [
                'academic_period_id' => $suggestedPeriodId ?? $activePeriod?->id,
                'subject_id' => $subjectIsAssigned ? $requestedSubjectId : null,
                'schedule_id' => $requestedSchedule !== null ? $requestedSchedule->id : null,
            ],
            'professor' => [
                'name' => $professor->name,
                'cedula' => $professor->professorProfile?->identity_document,
            ],
            'sede' => EvaluationPlanSheet::SEDE,
            'limits' => EvaluationPlanGrading::limits(),
        ]);
    }

    /**
     * Crea el plan con sus evaluaciones y calcula la ventana de fechas.
     */
    public function store(StoreEvaluationPlanRequest $request): RedirectResponse
    {
        $professor = $request->user();
        $data = $request->validated();

        abort_if($professor === null, 403);

        $subject = Subject::query()->findOrFail($data['subject_id']);

        $plan = DB::transaction(function () use ($data, $professor, $subject): EvaluationPlan {
            $plan = EvaluationPlan::query()->create([
                'professor_id' => $professor->id,
                'schedule_id' => $data['schedule_id'],
                'subject_id' => $subject->id,
                'academic_period_id' => $data['academic_period_id'],
                'modality' => $subject->modality,
            ]);

            foreach (array_values($data['items']) as $index => $item) {
                $plan->items()->create([
                    'position' => $index + 1,
                    'title' => $item['title'],
                    'content' => $item['content'] ?? null,
                    'weight' => $item['weight'],
                    'scheduled_on' => $item['scheduled_on'],
                ]);
            }

            $plan->syncScheduleWindow();

            return $plan;
        });

        return redirect()
            ->route('professor.plans.show', $plan)
            ->with('success', 'El plan de evaluación fue creado correctamente.');
    }

    /**
     * Muestra la planilla del plan con las notas y la definitiva calculada.
     */
    public function show(Request $request, EvaluationPlan $plan): Response
    {
        $this->authorizePlan($request, $plan);

        $plan->load([
            'professor.professorProfile',
            'schedule',
            'subject.career',
            'academicPeriod',
            'items',
        ]);

        $totalWeight = $plan->totalWeight();

        return Inertia::render('professor/plans/show', [
            'plan' => [
                'id' => $plan->id,
                'subject_id' => $plan->subject_id,
                'starts_on' => $plan->starts_on?->format('d/m/Y'),
                'ends_on' => $plan->ends_on?->format('d/m/Y'),
                'total_weight' => $totalWeight,
                'remaining_weight' => EvaluationPlanGrading::missingWeight($totalWeight),
                'is_complete' => $totalWeight === EvaluationPlanGrading::TOTAL_WEIGHT,
            ],
            'header' => EvaluationPlanSheet::header($plan),
            'items' => $plan->items
                ->map(static fn ($item): array => [
                    'id' => $item->id,
                    'position' => $item->position,
                    'title' => $item->title,
                    'content' => $item->content,
                    'weight' => $item->weight,
                    'scheduled_on' => $item->scheduled_on->format('d/m/Y'),
                    'scheduled_on_input' => $item->scheduled_on->toDateString(),
                ])
                ->values()
                ->all(),
            'students' => EvaluationPlanSheet::studentRows($plan),
            'date_options' => EvaluationPlanDates::options(
                EvaluationPlanDates::forScheduleSubject($plan->schedule, $plan->subject_id),
            ),
            'limits' => EvaluationPlanGrading::limits(),
        ]);
    }

    /**
     * Elimina el plan con sus evaluaciones y notas.
     */
    public function destroy(Request $request, EvaluationPlan $plan): RedirectResponse
    {
        $this->authorizePlan($request, $plan);

        $plan->delete();

        return redirect()
            ->route('professor.plans.index')
            ->with('success', 'El plan de evaluación fue eliminado.');
    }

    /**
     * Verifica que el plan pertenezca al docente autenticado.
     */
    private function authorizePlan(Request $request, EvaluationPlan $plan): void
    {
        abort_unless(
            $plan->professor_id === $request->user()?->id,
            403,
            'No tienes permiso para acceder a este plan de evaluación.',
        );
    }
}
