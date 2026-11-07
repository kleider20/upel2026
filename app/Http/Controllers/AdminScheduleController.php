<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\ScheduleRequest;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\Support\AcademicOptions;
use App\Support\StudentSchedule;
use App\Support\StudentSchedulePdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminScheduleController extends Controller
{
    /**
     * Listado de horarios publicados por carrera, período y cohorte.
     */
    public function index(Request $request): InertiaResponse
    {
        $this->authorizeView($request);

        $search = trim($request->string('search')->toString());
        $careerId = $request->integer('career_id') ?: null;

        $schedules = Schedule::query()
            ->with('career:id,name,code')
            ->when(
                $search !== '',
                static fn ($query) => $query->where(
                    static fn ($query) => $query
                        ->where('cohort', 'like', "%{$search}%")
                        ->orWhereHas(
                            'career',
                            static fn ($query) => $query
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%"),
                        ),
                ),
            )
            ->when($careerId, static fn ($query) => $query->where('career_id', $careerId))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Schedule $schedule): array => [
                'id' => $schedule->id,
                'career' => $schedule->career->name,
                'career_code' => $schedule->career->code,
                'period' => $schedule->period,
                'period_label' => $schedule->periodLabel(),
                'cohort' => $schedule->cohort,
                'modality_label' => AcademicOptions::modalityLabel($schedule->modality),
                'schedule_label' => AcademicOptions::scheduleLabel($schedule->study_schedule),
                'created_at' => $schedule->created_at?->format('d/m/Y'),
                'show_url' => route('admin.schedules.show', $schedule),
                'pdf_url' => route('admin.schedules.pdf', $schedule),
                'delete_url' => route('admin.schedules.destroy', $schedule),
            ]);

        return Inertia::render('admin/schedules/index', [
            'schedules' => $schedules,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'career_id' => $careerId,
            ],
            'careers' => $this->careers(),
            'stats' => [
                ['label' => 'Horarios', 'value' => (string) Schedule::query()->count(), 'tone' => 'blue'],
                ['label' => 'Carreras con horario', 'value' => (string) Schedule::query()->distinct()->count('career_id'), 'tone' => 'green'],
                ['label' => 'Períodos publicados', 'value' => (string) Schedule::query()->distinct()->count('period'), 'tone' => 'navy'],
                ['label' => 'Última cohorte', 'value' => (string) (Schedule::query()->orderByDesc('cohort')->value('cohort') ?? '—'), 'tone' => 'gold'],
            ],
            'can_manage' => $request->user()?->can(Permission::SchedulesManage->value) ?? false,
        ]);
    }

    /**
     * Formulario para publicar un horario con la plantilla oficial.
     */
    public function create(Request $request): InertiaResponse
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/schedules/form', [
            ...$this->formOptions(),
        ]);
    }

    /**
     * Registra un nuevo horario junto con las materias elegidas.
     */
    public function store(ScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $subjects = $validated['subjects'] ?? [];

        unset($validated['subjects']);

        $schedule = DB::transaction(static function () use ($validated, $subjects): Schedule {
            $schedule = Schedule::create($validated);

            $schedule->subjects()->sync(
                collect($subjects)
                    ->mapWithKeys(static function (array $subject): array {
                        $professorId = $subject['professor_id'] ?? null;
                        $professorId = $professorId === null || $professorId === ''
                            ? null
                            : (int) $professorId;
                        $teacherName = trim((string) ($subject['teacher_name'] ?? ''));
                        $dates = array_values(array_unique(array_map(
                            static fn (string $date): string => $date,
                            $subject['dates'] ?? [],
                        )));
                        sort($dates);

                        return [
                            (int) $subject['subject_id'] => [
                                'position' => (int) $subject['position'],
                                'professor_id' => $professorId,
                                'teacher_name' => $professorId === null && $teacherName !== ''
                                    ? $teacherName
                                    : null,
                                'dates' => json_encode($dates),
                                'starts_at' => $subject['starts_at'],
                                'ends_at' => $subject['ends_at'],
                            ],
                        ];
                    })
                    ->all(),
            );

            return $schedule;
        });

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', "El horario {$schedule->cohort} fue publicado correctamente.");
    }

    /**
     * Vista previa del horario publicado.
     */
    public function show(Request $request, Schedule $schedule): InertiaResponse
    {
        $this->authorizeView($request);

        $schedule->loadMissing('career');

        return Inertia::render('admin/schedules/show', [
            'schedule' => array_merge($schedule->toScheduleArray(), [
                'modality' => $schedule->modality,
            ]),
            'meta' => [
                'id' => $schedule->id,
                'career' => $schedule->career->name,
                'career_code' => $schedule->career->code,
                'period_label' => $schedule->periodLabel(),
                'cohort' => $schedule->cohort,
                'starts_on' => $schedule->starts_on?->format('d/m/Y'),
                'ends_on' => $schedule->ends_on?->format('d/m/Y'),
                'schedule_label' => AcademicOptions::scheduleLabel($schedule->study_schedule),
                'modality_label' => AcademicOptions::modalityLabel($schedule->modality),
                'modality' => $schedule->modality,
                'created_at' => $schedule->created_at?->format('d/m/Y H:i'),
            ],
            'pdf_url' => route('admin.schedules.pdf', $schedule),
            'delete_url' => route('admin.schedules.destroy', $schedule),
            'can_manage' => $request->user()?->can(Permission::SchedulesManage->value) ?? false,
        ]);
    }

    /**
     * Genera el PDF del horario publicado.
     */
    public function pdf(Request $request, Schedule $schedule): Response
    {
        $this->authorizeView($request);

        $schedule->loadMissing('career');

        $definition = $schedule->toScheduleArray();

        $filename = sprintf(
            'horario-%s-%s-%s.pdf',
            Str::slug((string) $schedule->career->code),
            Str::slug($schedule->periodLabel()),
            Str::slug($schedule->cohort),
        );

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response(StudentSchedulePdf::make($definition), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
        ]);
    }

    /**
     * Elimina un horario publicado.
     */
    public function destroy(Request $request, Schedule $schedule): RedirectResponse
    {
        $this->authorizeManage($request);

        $schedule->delete();

        return redirect()
            ->route('admin.schedules.index')
            ->with('success', "El horario {$schedule->cohort} fue eliminado correctamente.");
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SchedulesView->value),
            403,
            'No tienes permiso para acceder a los horarios.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SchedulesManage->value),
            403,
            'No tienes permiso para gestionar los horarios.',
        );
    }

    /**
     * Opciones compartidas por el formulario de alta.
     *
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'careers' => Career::query()
                ->where('is_active', true)
                ->with(['offerings' => static fn ($query) => $query
                    ->where('is_active', true)
                    ->orderBy('schedule')
                    ->orderBy('modality')
                    ->orderBy('shift')])
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'duration_semesters'])
                ->map(static fn (Career $career): array => [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'duration_semesters' => $career->duration_semesters,
                    'periods' => array_map(
                        static fn (int $period): array => [
                            'value' => $period,
                            'label' => StudentSchedule::roman($period),
                        ],
                        range(1, max(1, $career->duration_semesters)),
                    ),
                    'offerings' => $career->offerings
                        ->map(static fn (CareerOffering $offering): array => [
                            'id' => $offering->id,
                            'modality' => $offering->modality,
                            'modality_label' => $offering->modalityLabel(),
                            'schedule' => $offering->schedule,
                            'schedule_label' => $offering->scheduleLabel(),
                            'shift' => $offering->shift,
                            'shift_label' => $offering->shiftLabel(),
                        ])
                        ->values()
                        ->all(),
                    'schedules' => self::offeringOptions(
                        $career->offerings->pluck('schedule')->all(),
                        AcademicOptions::SCHEDULES,
                    ),
                    'modalities' => self::offeringOptions(
                        $career->offerings->pluck('modality')->all(),
                        AcademicOptions::MODALITIES,
                    ),
                ])
                ->all(),
            'template' => StudentSchedule::template(),
            'subjects' => Subject::query()
                ->where('is_active', true)
                ->with('professors:id,name')
                ->orderBy('semester')
                ->orderBy('name')
                ->get(['id', 'career_id', 'semester', 'code', 'name', 'modality'])
                ->map(static fn (Subject $subject): array => [
                    'id' => $subject->id,
                    'career_id' => $subject->career_id,
                    'semester' => $subject->semester,
                    'code' => $subject->code,
                    'name' => $subject->name,
                    'modality' => $subject->modality,
                    'professors' => $subject->professors
                        ->map(static fn (User $professor): array => [
                            'id' => $professor->id,
                            'name' => $professor->name,
                        ])
                        ->values()
                        ->all(),
                ])
                ->all(),
        ];
    }

    /**
     * Opciones presentes en la oferta activa de una carrera, en el orden oficial.
     *
     * @param  array<int, string>  $values
     * @param  array<string, string>  $labels
     * @return array<int, array{value: string, label: string}>
     */
    private static function offeringOptions(array $values, array $labels): array
    {
        $available = array_flip($values);

        return collect($labels)
            ->filter(static fn (string $label, string $value): bool => isset($available[$value]))
            ->map(static fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    /**
     * Carreras registradas para los filtros del listado.
     *
     * @return array<int, array{id: int, name: string, code: string}>
     */
    private function careers(): array
    {
        return Career::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(static fn (Career $career): array => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
            ])
            ->all();
    }
}
