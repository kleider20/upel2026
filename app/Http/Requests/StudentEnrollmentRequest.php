<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StudentEnrollmentRequest extends FormRequest
{
    /**
     * Solo el estudiante autenticado puede registrar su propia inscripción.
     */
    public function authorize(): bool
    {
        return $this->user()?->isStudent() === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'subjects' => ['present', 'array'],
            'subjects.*' => ['integer', 'exists:subjects,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subjects.present' => 'No se recibió la selección de materias.',
            'subjects.array' => 'La selección de materias no es válida.',
            'subjects.*.integer' => 'La selección de materias no es válida.',
            'subjects.*.exists' => 'Una de las materias seleccionadas no existe.',
        ];
    }

    /**
     * Materias seleccionadas por el estudiante.
     *
     * @return array<int, int>
     */
    public function subjectIds(): array
    {
        /** @var array<int, int|string> $subjects */
        $subjects = $this->validated('subjects');

        return array_values(array_map(
            static fn (int|string $subject): int => (int) $subject,
            $subjects,
        ));
    }
}
