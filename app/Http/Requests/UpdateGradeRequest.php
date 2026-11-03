<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
{
    /**
     * El profesor autenticado es la única persona que puede cargar la nota.
     */
    public function authorize(): bool
    {
        return $this->user()?->isProfessor() ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'final_grade' => ['required', 'numeric', 'min:0', 'max:10'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'final_grade.required' => 'Debes indicar la nota del estudiante.',
            'final_grade.numeric' => 'La nota debe ser un número.',
            'final_grade.min' => 'La nota mínima permitida es 0.',
            'final_grade.max' => 'La nota máxima permitida es 10.',
        ];
    }
}
