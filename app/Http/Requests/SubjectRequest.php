<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\Subject;
use App\Support\AcademicOptions;
use App\Support\SubjectCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest
{
    /**
     * Solo los roles con permiso de gestión pueden crear o editar materias.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::SubjectsManage->value) ?? false;
    }

    /**
     * Normaliza los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $semester = (int) $this->input('semester');
        $prerequisites = $semester > 1
            ? trim((string) $this->input('prerequisites'))
            : '';
        $modality = trim((string) $this->input('modality', 'presencial'));
        $code = trim((string) $this->input('code'));

        if ($code === '') {
            $code = SubjectCode::generate(
                (string) $this->input('name'),
                (int) $this->input('semester'),
                $modality,
                (string) $this->input('type'),
            );
        }

        $this->merge([
            'code' => self::normalizeCode($code),
            'name' => trim((string) $this->input('name')),
            'modality' => $modality,
            'component' => $this->filled('component')
                ? strtoupper(trim((string) $this->input('component')))
                : null,
            'type' => $this->filled('type')
                ? strtoupper(trim((string) $this->input('type')))
                : null,
            'area' => $this->filled('area')
                ? strtoupper(trim((string) $this->input('area')))
                : null,
            'level' => $this->filled('level')
                ? strtoupper(trim((string) $this->input('level')))
                : null,
            'prerequisites' => $prerequisites !== '' ? $prerequisites : null,
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * Conserva los códigos mixtos y normaliza a mayúsculas los de un solo caso.
     */
    private static function normalizeCode(string $code): string
    {
        $code = trim($code);

        if ($code === '') {
            return '';
        }

        $hasUppercase = preg_match('/[A-Z]/', $code) === 1;
        $hasLowercase = preg_match('/[a-z]/', $code) === 1;

        return $hasUppercase && $hasLowercase ? $code : strtoupper($code);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Subject|null $subject */
        $subject = $this->route('subject');
        $careerId = $this->integer('career_id');

        return [
            'career_id' => ['required', 'integer', 'exists:careers,id'],
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('subjects', 'code')
                    ->where(
                        static fn ($query) => $query->where('career_id', $careerId),
                    )
                    ->ignore($subject?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'integer', 'min:1', 'max:12'],
            'modality' => [
                'required',
                Rule::in(array_keys(AcademicOptions::MODALITIES)),
            ],
            'component' => ['nullable', 'string', 'max:20'],
            'type' => ['nullable', 'string', 'max:20'],
            'area' => ['nullable', 'string', 'max:40'],
            'level' => ['nullable', 'string', 'max:20'],
            'credits' => ['required', 'integer', 'min:0', 'max:30'],
            'theory_hours' => ['required', 'integer', 'min:0', 'max:40'],
            'practice_hours' => ['required', 'integer', 'min:0', 'max:40'],
            'prerequisites' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'career_id.required' => 'Selecciona la carrera a la que pertenece la materia.',
            'career_id.exists' => 'La carrera seleccionada no existe.',
            'code.required' => 'Indica el código de la materia.',
            'code.unique' => 'Ya existe una materia con ese código en la carrera seleccionada.',
            'name.required' => 'Indica el nombre de la materia.',
            'semester.required' => 'Indica el periodo de la materia.',
            'semester.min' => 'El periodo debe ser al menos 1.',
            'semester.max' => 'El periodo no puede ser mayor a 12.',
            'modality.required' => 'Selecciona la modalidad de la materia.',
            'modality.in' => 'La modalidad seleccionada no es válida.',
            'credits.required' => 'Indica los créditos de la materia.',
            'theory_hours.required' => 'Indica las horas teóricas.',
            'practice_hours.required' => 'Indica las horas prácticas.',
        ];
    }
}
