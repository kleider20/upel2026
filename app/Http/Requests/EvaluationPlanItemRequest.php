<?php

namespace App\Http\Requests;

use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use App\Support\EvaluationPlanDates;
use App\Support\EvaluationPlanGrading;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class EvaluationPlanItemRequest extends FormRequest
{
    /**
     * Solo el docente dueño del plan puede editar sus evaluaciones.
     */
    public function authorize(): bool
    {
        $plan = $this->route('plan');

        return $plan instanceof EvaluationPlan
            && $plan->professor_id === $this->user()?->id;
    }

    /**
     * Normaliza el nombre y el contenido de la evaluación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->isMethod('delete')) {
            return;
        }

        $content = trim((string) $this->input('content'));

        $this->merge([
            'title' => trim((string) $this->input('title')),
            'content' => $content !== '' ? $content : null,
            'weight' => (int) $this->input('weight'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        if ($this->isMethod('delete')) {
            return [];
        }

        return [
            'title' => ['required', 'string', 'max:120'],
            'content' => ['nullable', 'string', 'max:2000'],
            'weight' => [
                'required',
                'integer',
                'min:'.EvaluationPlanGrading::MIN_ITEM_WEIGHT,
                'max:'.EvaluationPlanGrading::MAX_ITEM_WEIGHT,
            ],
            'scheduled_on' => ['required', 'date'],
        ];
    }

    /**
     * Evita que la evaluación supere el porcentaje disponible del plan.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $plan = $this->route('plan');
            $item = $this->route('item');

            if (! $plan instanceof EvaluationPlan) {
                return;
            }

            $usedWeight = $plan->items
                ->when(
                    $item instanceof EvaluationPlanItem,
                    static fn ($items) => $items->where('id', '!=', $item->id),
                )
                ->sum('weight');

            $available = EvaluationPlanGrading::missingWeight((int) $usedWeight);

            if ((int) $this->input('weight') > $available) {
                $validator->errors()->add(
                    'weight',
                    "Solo quedan {$available} % disponibles en este plan.",
                );
            }

            $classDates = EvaluationPlanDates::forScheduleSubject(
                $plan->schedule,
                $plan->subject_id,
            );

            $scheduledOn = trim((string) $this->input('scheduled_on'));

            if ($scheduledOn === '') {
                return;
            }

            $ignoreItemId = $item instanceof EvaluationPlanItem ? $item->id : null;

            if (EvaluationPlanDates::isUsed($plan, $scheduledOn, $ignoreItemId)) {
                $validator->errors()->add(
                    'scheduled_on',
                    'Esa fecha ya está asignada a otra evaluación del plan.',
                );

                return;
            }

            $keepsCurrentDate = $item instanceof EvaluationPlanItem
                && $item->scheduled_on->toDateString() === Carbon::parse($scheduledOn)->toDateString();

            if ($keepsCurrentDate) {
                return;
            }

            if ($classDates === []) {
                $validator->errors()->add(
                    'scheduled_on',
                    'La materia no tiene horario asignado; no es posible programar evaluaciones.',
                );
            } elseif (! EvaluationPlanDates::includes($classDates, $scheduledOn)) {
                $validator->errors()->add(
                    'scheduled_on',
                    'La fecha debe corresponder a un día de clase del horario asignado a la materia.',
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Indica el nombre de la evaluación.',
            'title.max' => 'El nombre de la evaluación no puede superar los 120 caracteres.',
            'content.max' => 'El contenido de la evaluación no puede superar los 2000 caracteres.',
            'weight.required' => 'Indica el porcentaje de la evaluación.',
            'weight.min' => 'Cada evaluación debe valer al menos '.EvaluationPlanGrading::MIN_ITEM_WEIGHT.' %.',
            'weight.max' => 'Cada evaluación puede valer como máximo '.EvaluationPlanGrading::MAX_ITEM_WEIGHT.' %.',
            'scheduled_on.required' => 'Selecciona la fecha de la evaluación.',
            'scheduled_on.date' => 'La fecha de la evaluación no es válida.',
        ];
    }
}
