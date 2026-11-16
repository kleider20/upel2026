<?php

namespace App\Http\Requests;

use App\Models\EvaluationPlan;
use App\Models\Schedule;
use App\Models\Subject;
use App\Support\EvaluationPlanDates;
use App\Support\EvaluationPlanGrading;
use App\Support\ProfessorAssignments;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class StoreEvaluationPlanRequest extends FormRequest
{
    /**
     * Solo el docente puede crear sus propios planes de evaluación.
     */
    public function authorize(): bool
    {
        return $this->user()?->isProfessor() ?? false;
    }

    /**
     * Normaliza las evaluaciones del plan antes de validarlas.
     */
    protected function prepareForValidation(): void
    {
        $items = collect($this->input('items', []))
            ->filter(static fn (mixed $item): bool => is_array($item))
            ->values()
            ->map(static function (array $item): array {
                $content = trim((string) ($item['content'] ?? ''));

                return [
                    'title' => trim((string) ($item['title'] ?? '')),
                    'content' => $content !== '' ? $content : null,
                    'weight' => (int) ($item['weight'] ?? 0),
                    'scheduled_on' => trim((string) ($item['scheduled_on'] ?? '')),
                ];
            })
            ->all();

        $this->merge(['items' => $items]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'schedule_id' => ['required', 'integer', 'exists:schedules,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_period_id' => ['required', 'integer', 'exists:academic_periods,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.title' => ['required', 'string', 'max:120'],
            'items.*.content' => ['nullable', 'string', 'max:2000'],
            'items.*.weight' => [
                'required',
                'integer',
                'min:'.EvaluationPlanGrading::MIN_ITEM_WEIGHT,
                'max:'.EvaluationPlanGrading::MAX_ITEM_WEIGHT,
            ],
            'items.*.scheduled_on' => ['required', 'date'],
        ];
    }

    /**
     * Valida la ponderación total, la carrera del cohorte y la titularidad.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $weightTotal = (int) collect($this->input('items', []))->sum('weight');

            if ($weightTotal > EvaluationPlanGrading::TOTAL_WEIGHT) {
                $validator->errors()->add(
                    'items',
                    'La ponderación total del plan no puede superar el 100 %.',
                );
            }

            $schedule = Schedule::query()->find($this->input('schedule_id'));
            $subject = Subject::query()->find($this->input('subject_id'));
            $professor = $this->user();

            if ($schedule === null || $subject === null || $professor === null) {
                return;
            }

            if ($subject->career_id !== $schedule->career_id) {
                $validator->errors()->add(
                    'subject_id',
                    'La materia seleccionada no pertenece a la carrera del cohorte.',
                );
            }

            $teachesSubject = ProfessorAssignments::teachesSubject($professor, $subject->id);

            if (! $teachesSubject) {
                $validator->errors()->add(
                    'subject_id',
                    'Solo puedes crear planes de las materias que un horario te tiene asignadas.',
                );
            }

            $alreadyExists = EvaluationPlan::query()
                ->where('professor_id', $professor->id)
                ->where('schedule_id', $schedule->id)
                ->where('subject_id', $subject->id)
                ->where('academic_period_id', (int) $this->input('academic_period_id'))
                ->exists();

            if ($alreadyExists) {
                $validator->errors()->add(
                    'subject_id',
                    'Ya existe un plan de evaluación para esta materia, cohorte y período.',
                );
            }

            $classDates = EvaluationPlanDates::forScheduleSubject($schedule, $subject->id);

            if ($classDates === []) {
                $validator->errors()->add(
                    'subject_id',
                    'La materia no tiene horario asignado en este cohorte; no es posible programar evaluaciones.',
                );

                return;
            }

            /** @var array<int, array<string, mixed>> $items */
            $items = collect($this->input('items', []))->values()->all();

            /** @var array<string, true> $usedDates */
            $usedDates = [];

            foreach ($items as $index => $item) {
                $scheduledOn = trim((string) ($item['scheduled_on'] ?? ''));

                if ($scheduledOn === '') {
                    continue;
                }

                if (! EvaluationPlanDates::includes($classDates, $scheduledOn)) {
                    $validator->errors()->add(
                        "items.{$index}.scheduled_on",
                        'La fecha debe corresponder a un día de clase del horario asignado a la materia.',
                    );

                    continue;
                }

                $date = Carbon::parse($scheduledOn)->toDateString();

                if (isset($usedDates[$date])) {
                    $validator->errors()->add(
                        "items.{$index}.scheduled_on",
                        'Esa fecha ya está asignada a otra evaluación del plan.',
                    );

                    continue;
                }

                $usedDates[$date] = true;
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'schedule_id.required' => 'Selecciona la carrera y el cohorte.',
            'schedule_id.exists' => 'El cohorte seleccionado ya no está disponible.',
            'subject_id.required' => 'Selecciona la materia del plan.',
            'subject_id.exists' => 'La materia seleccionada ya no está disponible.',
            'academic_period_id.required' => 'Selecciona el período académico.',
            'academic_period_id.exists' => 'El período seleccionado ya no está disponible.',
            'items.required' => 'Agrega al menos una evaluación al plan.',
            'items.min' => 'Agrega al menos una evaluación al plan.',
            'items.*.title.required' => 'Indica el nombre de cada evaluación.',
            'items.*.title.max' => 'El nombre de la evaluación no puede superar los 120 caracteres.',
            'items.*.content.max' => 'El contenido de la evaluación no puede superar los 2000 caracteres.',
            'items.*.weight.required' => 'Indica el porcentaje de cada evaluación.',
            'items.*.weight.min' => 'Cada evaluación debe valer al menos '.EvaluationPlanGrading::MIN_ITEM_WEIGHT.' %.',
            'items.*.weight.max' => 'Cada evaluación puede valer como máximo '.EvaluationPlanGrading::MAX_ITEM_WEIGHT.' %.',
            'items.*.scheduled_on.required' => 'Selecciona la fecha de cada evaluación.',
            'items.*.scheduled_on.date' => 'La fecha de la evaluación no es válida.',
        ];
    }
}
