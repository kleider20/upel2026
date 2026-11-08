<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\ProfessorProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfessorRequest extends FormRequest
{
    /**
     * Solo los usuarios con permiso pueden gestionar profesores.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::ProfessorsManage->value) ?? false;
    }

    /**
     * Normaliza los datos de identificación y los campos opcionales.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'email' => Str::lower(trim((string) $this->input('email'))),
            'employee_code' => Str::upper(trim((string) $this->input('employee_code'))),
            'department' => $this->filled('department')
                ? trim((string) $this->input('department'))
                : null,
            'academic_title' => $this->filled('academic_title')
                ? trim((string) $this->input('academic_title'))
                : null,
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $professor = $this->route('professor');
        $professor = $professor instanceof ProfessorProfile ? $professor : null;
        $emailRule = Rule::unique('users', 'email');
        $employeeCodeRule = Rule::unique('professor_profiles', 'employee_code');

        if ($professor !== null) {
            $emailRule->ignore($professor->user_id);
            $employeeCodeRule->ignore($professor->id);
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $emailRule],
            'employee_code' => ['required', 'string', 'max:255', $employeeCodeRule],
            'department' => ['nullable', 'string', 'max:255'],
            'academic_title' => ['nullable', 'string', 'max:255'],
            'password' => $professor === null
                ? ['required', 'string', Password::default(), 'confirmed']
                : ['prohibited'],
            'password_confirmation' => $professor === null
                ? ['required', 'string']
                : ['prohibited'],
            'subject_ids' => ['present', 'array', 'list'],
            'subject_ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'employee_code.required' => 'Indica el código del profesor.',
            'employee_code.unique' => 'Ya existe un profesor con ese código.',
            'password.required' => 'Define una contraseña temporal para el profesor.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'subject_ids.present' => 'Indica las materias asignadas, aunque no se seleccione ninguna.',
            'subject_ids.*.distinct' => 'No repitas una materia en la asignación.',
            'subject_ids.*.exists' => 'Una de las materias seleccionadas ya no está disponible.',
        ];
    }
}
