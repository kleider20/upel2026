<?php

namespace App\Http\Requests;

use App\Enums\Role;
use App\Models\StudentProfile;
use App\Support\AcademicOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateStudentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasRole(Role::Admin->value);
    }

    /**
     * Normaliza los datos antes de validarlos.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var StudentProfile $student */
        $student = $this->route('student');

        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($student->user_id),
            ],
            'student_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('student_profiles', 'student_code')->ignore($student->id),
            ],
            'career_id' => ['nullable', 'integer', 'exists:careers,id'],
            'current_semester' => ['required', 'integer', 'min:1', 'max:255'],
            'status' => ['required', Rule::in(['activo', 'preinscrito', 'suspendido', 'egresado'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'shift' => ['nullable', Rule::in(array_keys(AcademicOptions::SHIFTS))],
            'advisor' => ['nullable', 'string', 'max:255'],
            'admission_year' => [
                'nullable',
                'integer',
                'min:1900',
                'max:'.max((int) now()->year, (int) config('admissions.period_year')),
            ],
            'graduation_year' => ['nullable', 'integer', 'min:1900', 'max:'.now()->addYears(15)->year],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::of((string) $this->input('name'))->squish()->toString(),
            'email' => Str::lower(trim((string) $this->input('email'))),
            'student_code' => Str::upper(trim((string) $this->input('student_code'))),
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'Este correo ya está asociado a otro usuario.',
            'student_code.unique' => 'Este código ya pertenece a otro estudiante.',
            'career_id.exists' => 'La carrera seleccionada no existe.',
        ];
    }
}
