<?php

namespace App\Http\Requests;

use App\Models\Classroom;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ClassroomRequest extends FormRequest
{
    /**
     * Solo gestión de horarios puede administrar las aulas.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('schedules.manage') ?? false;
    }

    /**
     * Normaliza el código antes de validarlo.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => Str::upper(trim((string) $this->input('code'))),
            'name' => trim((string) $this->input('name')),
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Classroom|null $classroom */
        $classroom = $this->route('classroom');

        return [
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('classrooms', 'code')->ignore($classroom?->id),
            ],
            'name' => ['required', 'string', 'max:120'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Indica el código del aula.',
            'code.unique' => 'Ya existe un aula con este código.',
            'name.required' => 'Indica el nombre del aula.',
            'capacity.min' => 'La capacidad debe ser al menos 1.',
        ];
    }
}
