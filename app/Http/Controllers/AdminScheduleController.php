<?php

namespace App\Http\Controllers;

use App\Actions\Schedules\NotifyMatchingStudents;
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
                'edit_url' => route('admin.schedules.edit', $schedule),
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
            'schedule' => null,
            ...$this->formOptions(),
        ]);
    }

    /**
     * Formulario para editar un horario publicado.
     */
    public function edit(Request $request, Schedule $schedule): InertiaResponse
    {
        $this->authorizeManage($request);

        $schedule->load('subjects');

        $subjects = $schedule->subjects
            ->map(static function (Subject $subject): array {
                $dates = $subject->pivot->dates;
                $dateTimes = $subject->pivot->date_times;

                if (is_string($dates)) {
                    $dates = json_decode($dates, true);
                }

                if (is_string($dateTimes)) {
                    $dateTimes = json_decode($dateTimes, true);
                }

                $dates = is_array($dates) ? array_values($dates) : [];
                $dateTimes = is_array($dateTimes) ? $dateTimes : [];
                $startsAt = substr((string) $subject->pivot->starts_at, 0, 5);
                $endsAt = substr((string) $subject->pivot->ends_at, 0, 5);

                foreach ($dates as $date) {
                    $dateTimes[$date] ??= [
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                    ];
                }

                return [
                    'position' => (int) $subject->pivot->position,
                    'subject_id' => (string) $subject->id,
                    'professor_id' => $subject->pivot->professor_id !== null
                        ? (string) $subject->pivot->professor_id
                        : '',
                    'teacher_name' => (string) ($subject->pivot->teacher_name ?? ''),
                    'dates' => $dates,
                    'date_times' => $dateTimes,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/schedules/form', [
            'schedule' => [
                'id' => $schedule->id,
                'career_id' => (string) $schedule->career_id,
                'period' => (string) $schedule->period,
                'cohort' => $schedule->cohort,
                'study_schedule' => (string) $schedule->study_schedule,
                'modality' => (string) $schedule->modality,
                'starts_on' => $schedule->starts_on?->toDateString() ?? '',
                'ends_on' => $schedule->ends_on?->toDateString() ?? '',
                'subjects' => $subjects,
            ],
            ...$this->formOptions($schedule),
        ]);
    }

    /**
     * Registra un nuevo horario junto con las materias elegidas.
     */
    public function store(
        ScheduleRequest $request,
        NotifyMatchingStudents $notifyMatchingStudents,
    ): RedirectResponse {
        $validated = $request->validated();
        $subjects = $validated['subjects'] ?? [];

        unset($validated['subjects']);
        $subjectData = self::subjectPivotData($subjects);

        $schedule = DB::transaction(static function () use (
            $validated,
            $subjectData,
            $notifyMatchingStudents,
        ): Schedule {
            $schedule = Schedule::create($validated);

            $schedule->subjects()->sync($subjectData);
            $notifyMatchingStudents->handle($schedule);

            return $schedule;
        });

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', "El horario {$schedule->cohort} fue publicado correctamente.");
    }

    /**
     * Actualiza un horario publicado y sus materias seleccionadas.
     */
    public function update(
        ScheduleRequest $request,
        Schedule $schedule,
        NotifyMatchingStudents $notifyMatchingStudents,
    ): RedirectResponse {
        $validated = $request->validated();
        $subjects = $validated['subjects'] ?? [];

        unset($validated['subjects']);
        $subjectData = self::subjectPivotData($subjects);

        DB::transaction(static function () use (
            $schedule,
            $validated,
            $subjectData,
            $notifyMatchingStudents,
        ): void {
            $schedule->update($validated);
            $schedule->subjects()->sync($subjectData);
            $notifyMatchingStudents->handle($schedule);
        });

        return redirect()
            ->route('admin.schedules.show', $schedule)
            ->with('success', "El horario {$schedule->cohort} fue actualizado correctamente.");
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
            'edit_url' => route('admin.schedules.edit', $schedule),
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

        $definition = $schedule->toScheduleArray(forPdf: true);

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
     * Convierte las materias validadas al formato de sincronización de la relación.
     *
     * @param  array<int, array<string, mixed>>  $subjects
     * @return array<int, array<string, mixed>>
     */
    private static function subjectPivotData(array $subjects): array
    {
        return collect($subjects)
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
                $dateTimes = array_intersect_key(
                    $subject['date_times'],
                    array_flip($dates),
                );
                $firstDateTime = reset($dateTimes);

                return [
                    (int) $subject['subject_id'] => [
                        'position' => (int) $subject['position'],
                        'professor_id' => $professorId,
                        'teacher_name' => $professorId === null && $teacherName !== ''
                            ? $teacherName
                            : null,
                        'dates' => json_encode($dates),
                        'date_times' => json_encode($dateTimes),
                        'starts_at' => $firstDateTime['starts_at'] ?? null,
                        'ends_at' => $firstDateTime['ends_at'] ?? null,
                    ],
                ];
            })
            ->all();
    }

    /**
     * Opciones compartidas por los formularios de alta y edición.
     *
     * @return array<string, mixed>
     */
    private function formOptions(?Schedule $schedule = null): array
    {
        $scheduleSubjectIds = $schedule?->subjects->pluck('id')->all() ?? [];

        return [
            'careers' => Career::query()
                ->where(static function ($query) use ($schedule): void {
                    $query->where('is_active', true);

                    if ($schedule !== null) {
                        $query->orWhereKey($schedule->career_id);
                    }
                })
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
                ->where(static function ($query) use ($scheduleSubjectIds): void {
                    $query->where('is_active', true);

                    if ($scheduleSubjectIds !== []) {
                        $query->orWhereIn('id', $scheduleSubjectIds);
                    }
                })
                ->with([
                    'professors' => static fn ($query) => $query
                        ->whereHas('professorProfile')
                        ->select('users.id', 'users.name'),
                ])
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
