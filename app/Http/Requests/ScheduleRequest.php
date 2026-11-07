<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\Career;
use App\Models\Schedule;
use App\Models\Subject;
use App\Support\AcademicOptions;
use App\Support\ScheduleCalendar;
use App\Support\StudentSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ScheduleRequest extends FormRequest
{
    /**
     * Solo los roles con permiso de gestión pueden publicar horarios.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::SchedulesManage->value) ?? false;
    }

    /**
     * Normaliza la cohorte antes de validarla.
     */
    protected function prepareForValidation(): void
    {
        $cohort = strtoupper(trim((string) $this->input('cohort')));
        $cohort = preg_replace('/\s*-\s*/', '-', $cohort) ?? $cohort;

        $this->merge([
            'cohort' => $cohort,
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Schedule|null $schedule */
        $schedule = $this->route('schedule');
        $careerId = $this->integer('career_id');
        $period = $this->integer('period');
        $maxPosition = count(StudentSchedule::template()['subjects']);

        return [
            'career_id' => ['required', 'integer', 'exists:careers,id'],
            'period' => ['required', 'integer', 'min:1', 'max:12'],
            'cohort' => [
                'required',
                'string',
                'regex:/^\d{4}-(I|II)$/',
                Rule::unique('schedules', 'cohort')
                    ->where(
                        static fn ($query) => $query
                            ->where('career_id', $careerId)
                            ->where('period', $period),
                    )
                    ->ignore($schedule?->id),
            ],
            'study_schedule' => ['required', Rule::in(array_keys(AcademicOptions::SCHEDULES))],
            'modality' => ['nullable', Rule::in(array_keys(AcademicOptions::MODALITIES))],
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'ends_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:starts_on'],
            'subjects' => ['required', 'array', 'min:1', 'max:'.$maxPosition],
            'subjects.*.position' => ['required', 'integer', 'min:1', 'max:'.$maxPosition, 'distinct'],
            'subjects.*.subject_id' => ['required', 'integer', 'distinct', 'exists:subjects,id'],
            'subjects.*.professor_id' => ['nullable', 'integer', 'exists:users,id'],
            'subjects.*.teacher_name' => ['nullable', 'string', 'max:120'],
            'subjects.*.dates' => ['required', 'array', 'min:1'],
            'subjects.*.dates.*' => ['required', 'date_format:Y-m-d'],
            'subjects.*.starts_at' => ['required', 'date_format:H:i'],
            'subjects.*.ends_at' => ['required', 'date_format:H:i'],
        ];
    }

    /**
     * Comprueba que el período y las materias correspondan a la carrera.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $career = Career::query()->find($this->integer('career_id'));
            $period = $this->integer('period');

            if ($career === null) {
                return;
            }

            $validPeriod = $period >= 1 && $period <= $career->duration_semesters;

            if (! $validPeriod) {
                $validator->errors()->add(
                    'period',
                    'El período debe estar entre I y '.StudentSchedule::roman($career->duration_semesters).'.',
                );
            }

            $startsOn = (string) $this->input('starts_on');
            $endsOn = (string) $this->input('ends_on');
            $studySchedule = (string) $this->input('study_schedule');

            if (array_key_exists($studySchedule, AcademicOptions::SCHEDULES)) {
                $offerings = $career->offerings()->get(['schedule', 'modality', 'is_active']);

                if ($offerings->isNotEmpty()) {
                    $activeSchedules = $offerings
                        ->where('is_active', true)
                        ->pluck('schedule');

                    if (! $activeSchedules->contains($studySchedule)) {
                        $validator->errors()->add(
                            'study_schedule',
                            'El tipo de horario seleccionado no está activo en la oferta de la carrera.',
                        );
                    }
                }
            }

            $modality = (string) $this->input('modality');

            if (array_key_exists($modality, AcademicOptions::MODALITIES)) {
                $offerings = $career->offerings()->get(['modality', 'is_active']);

                if ($offerings->isNotEmpty()) {
                    $activeModalities = $offerings
                        ->where('is_active', true)
                        ->pluck('modality');

                    if (! $activeModalities->contains($modality)) {
                        $validator->errors()->add(
                            'modality',
                            'La modalidad seleccionada no está activa en la oferta de la carrera.',
                        );
                    }
                }
            }

            $allowedDates = [];

            if (
                preg_match('/^\d{4}-\d{2}-\d{2}$/', $startsOn) === 1
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endsOn) === 1
                && $endsOn >= $startsOn
                && array_key_exists($studySchedule, AcademicOptions::SCHEDULES)
            ) {
                $allowedDates = array_flip(ScheduleCalendar::classDates(
                    $startsOn,
                    $endsOn,
                    $studySchedule,
                ));

                if ($allowedDates === []) {
                    $validator->errors()->add(
                        'starts_on',
                        $studySchedule === 'sabatino'
                            ? 'El rango de fechas no contiene ningún sábado.'
                            : 'El rango de fechas no contiene ningún día de lunes a viernes.',
                    );
                }
            }

            $subjects = $this->input('subjects');

            if (! is_array($subjects) || $subjects === []) {
                return;
            }

            $subjectIds = [];

            foreach ($subjects as $subject) {
                $subjectId = is_array($subject) ? ($subject['subject_id'] ?? null) : null;

                if (is_numeric($subjectId)) {
                    $subjectIds[] = (int) $subjectId;
                }
            }

            if ($subjectIds === []) {
                return;
            }

            $allowedSubjects = Subject::query()
                ->whereIn('id', $subjectIds)
                ->where('career_id', $career->id)
                ->when($validPeriod, static fn ($query) => $query->where('semester', $period))
                ->with('professors:id')
                ->get()
                ->keyBy('id');

            $templateTeachers = collect(StudentSchedule::template()['subjects'])
                ->pluck('teacher')
                ->filter()
                ->unique()
                ->values();

            foreach ($subjects as $index => $subject) {
                $subjectId = is_array($subject) ? (int) ($subject['subject_id'] ?? 0) : 0;
                $allowed = $allowedSubjects->get($subjectId);

                if ($allowed === null) {
                    $validator->errors()->add(
                        "subjects.{$index}.subject_id",
                        'La materia debe pertenecer a la carrera y al período seleccionados.',
                    );

                    continue;
                }

                $professorId = is_array($subject) ? ($subject['professor_id'] ?? null) : null;
                $teacherName = is_array($subject)
                    ? trim((string) ($subject['teacher_name'] ?? ''))
                    : '';
                $dates = is_array($subject) ? ($subject['dates'] ?? []) : [];
                $startsAt = is_array($subject) ? (string) ($subject['starts_at'] ?? '') : '';
                $endsAt = is_array($subject) ? (string) ($subject['ends_at'] ?? '') : '';

                if ($allowedDates !== [] && is_array($dates)) {
                    $invalidDate = false;

                    foreach ($dates as $date) {
                        if (! is_string($date) || ! isset($allowedDates[$date])) {
                            $invalidDate = true;

                            break;
                        }
                    }

                    if ($invalidDate) {
                        $validator->errors()->add(
                            "subjects.{$index}.dates",
                            'Cada fecha debe existir dentro del rango y corresponder al tipo de horario.',
                        );
                    }

                    if (count($dates) !== count(array_unique($dates))) {
                        $validator->errors()->add(
                            "subjects.{$index}.dates",
                            'Una fecha no puede repetirse en la misma materia.',
                        );
                    }
                }

                if (
                    preg_match('/^\d{2}:\d{2}$/', $startsAt) === 1
                    && preg_match('/^\d{2}:\d{2}$/', $endsAt) === 1
                    && $endsAt <= $startsAt
                ) {
                    $validator->errors()->add(
                        "subjects.{$index}.ends_at",
                        'La hora de fin debe ser posterior a la hora de inicio.',
                    );
                }

                if ($professorId !== null && $professorId !== '') {
                    if (! $allowed->professors->contains('id', (int) $professorId)) {
                        $validator->errors()->add(
                            "subjects.{$index}.professor_id",
                            'El docente debe estar asignado a la materia seleccionada.',
                        );
                    }
                } elseif ($teacherName !== '' && ! $templateTeachers->contains($teacherName)) {
                    $validator->errors()->add(
                        "subjects.{$index}.teacher_name",
                        'El docente debe pertenecer a la plantilla oficial del horario.',
                    );
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'career_id.required' => 'Selecciona la carrera del horario.',
            'career_id.exists' => 'La carrera seleccionada no existe.',
            'period.required' => 'Selecciona el período académico.',
            'period.min' => 'El período debe ser al menos I.',
            'period.max' => 'El período no puede ser mayor a XII.',
            'cohort.required' => 'Indica la cohorte del horario.',
            'cohort.regex' => 'La cohorte debe tener el formato 2025-II (año, guion y momento).',
            'cohort.unique' => 'Ya existe un horario para esa carrera, período y cohorte.',
            'study_schedule.required' => 'Selecciona el tipo de horario.',
            'study_schedule.in' => 'El tipo de horario debe ser Sabatino o Lunes a viernes.',
            'modality.in' => 'La modalidad debe ser Presencial, Online o Semipresencial.',
            'starts_on.required' => 'Indica la fecha de inicio de clases.',
            'starts_on.date_format' => 'La fecha de inicio debe tener el formato AAAA-MM-DD.',
            'ends_on.required' => 'Indica la fecha de finalización de clases.',
            'ends_on.date_format' => 'La fecha de finalización debe tener el formato AAAA-MM-DD.',
            'ends_on.after_or_equal' => 'La fecha de finalización debe ser posterior o igual a la fecha de inicio.',
            'subjects.required' => 'Selecciona al menos una materia para el horario.',
            'subjects.min' => 'Selecciona al menos una materia para el horario.',
            'subjects.*.position.distinct' => 'Cada materia debe ocupar una fila distinta del horario.',
            'subjects.*.subject_id.required' => 'Selecciona una materia para cada fila usada.',
            'subjects.*.subject_id.distinct' => 'Una materia no puede repetirse en el horario.',
            'subjects.*.subject_id.exists' => 'La materia seleccionada no existe.',
            'subjects.*.professor_id.exists' => 'El docente seleccionado no existe.',
            'subjects.*.dates.required' => 'Selecciona al menos un día de clase para cada materia.',
            'subjects.*.dates.min' => 'Selecciona al menos un día de clase para cada materia.',
            'subjects.*.dates.*.date_format' => 'Cada día de clase debe ser una fecha válida.',
            'subjects.*.dates.*.distinct' => 'Una fecha no puede repetirse en la misma materia.',
            'subjects.*.starts_at.required' => 'Indica la hora de inicio de la materia.',
            'subjects.*.starts_at.date_format' => 'La hora de inicio debe tener el formato HH:MM.',
            'subjects.*.ends_at.required' => 'Indica la hora de fin de la materia.',
            'subjects.*.ends_at.date_format' => 'La hora de fin debe tener el formato HH:MM.',
        ];
    }
}
