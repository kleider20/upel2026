<?php

namespace App\Http\Requests;

use App\Models\EvaluationPlan;
use App\Support\EvaluationPlanGrading;
use Illuminate\Foundation\Http\FormRequest;

class EvaluationPlanScoresRequest extends FormRequest
{
    /**
     * Solo el docente dueño del plan puede cargar las notas.
     */
    public function authorize(): bool
    {
        $plan = $this->route('plan');

        return $plan instanceof EvaluationPlan
            && $plan->professor_id === $this->user()?->id;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'scores' => ['present', 'array'],
            'scores.*.item_id' => ['required', 'integer'],
            'scores.*.student_id' => ['nullable', 'integer'],
            'scores.*.enrollment_id' => ['nullable', 'integer'],
            'scores.*.score' => [
                'nullable',
                'numeric',
                'min:1',
                'max:'.EvaluationPlanGrading::MAX_ITEM_SCORE,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'scores.present' => 'No se recibieron notas para guardar.',
            'scores.*.score.numeric' => 'Las notas deben ser números.',
            'scores.*.score.min' => 'La nota mínima de una evaluación es 1.',
            'scores.*.score.max' => 'La nota máxima de una evaluación es 20.',
        ];
    }
}
