<?php

namespace App\Http\Requests;

use App\Models\Career;
use App\Models\CareerOffering;
use App\Support\AcademicOptions;
use App\Support\AdmissionIdentity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAdmissionRequest extends FormRequest
{
    /**
     * El formulario de preinscripción es público.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => Str::of((string) $this->input('first_name'))->squish()->title()->toString(),
            'last_name' => Str::of((string) $this->input('last_name'))->squish()->title()->toString(),
            'nationality' => Str::upper(Str::substr((string) $this->input('nationality', 'V'), 0, 1)),
            'id_number' => preg_replace('/\D/', '', (string) $this->input('id_number')) ?? '',
            'email' => Str::lower(trim((string) $this->input('email'))),
            'phone' => trim((string) $this->input('phone')),
            'high_school' => Str::of((string) $this->input('high_school'))->squish()->toString(),
            'address' => Str::of((string) $this->input('address'))->squish()->toString(),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $periodYear = (int) config('admissions.period_year');

        return [
            'first_name' => ['required', 'string', 'min:2', 'max:80'],
            'last_name' => ['required', 'string', 'min:2', 'max:80'],
            'nationality' => ['required', Rule::in(['V', 'E'])],
            'id_number' => [
                'required',
                'string',
                'regex:/^\d{5,9}$/',
                Rule::unique('admissions', 'id_number')
                    ->where(fn ($query) => $query->where('period_year', $periodYear)),
            ],
            'birth_date' => [
                'required',
                'date',
                'after_or_equal:1940-01-01',
                'before_or_equal:'.now()->subYears(15)->toDateString(),
            ],
            'gender' => ['nullable', Rule::in(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
                Rule::unique('admissions', 'email')
                    ->where(fn ($query) => $query->where('period_year', $periodYear)),
            ],
            'phone' => ['required', 'string', 'regex:/^[0-9+()\-\s]{7,30}$/'],
            'address' => ['nullable', 'string', 'max:500'],

            'career_id' => ['required', 'integer', 'exists:careers,id'],
            'modality' => ['required', Rule::in(array_keys(AcademicOptions::MODALITIES))],
            'schedule' => ['required', Rule::in(array_keys(AcademicOptions::SCHEDULES))],
            'shift' => ['required', Rule::in(array_keys(AcademicOptions::SHIFTS))],

            'high_school' => ['required', 'string', 'min:3', 'max:200'],
            'high_school_year' => ['required', 'integer', 'min:1980', 'max:'.now()->year],
            'high_school_average' => ['required', 'numeric', 'min:0', 'max:20'],

            'terms' => ['accepted'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $idNumber = (string) $this->input('id_number');
                $email = (string) $this->input('email');

                $duplicateErrors = AdmissionIdentity::duplicateErrors(
                    $validator->errors()->has('id_number') ? null : $idNumber,
                    $validator->errors()->has('email') ? null : $email,
                );

                foreach ($duplicateErrors as $field => $message) {
                    $validator->errors()->add($field, $message);
                }
            },
            function (Validator $validator): void {
                if ($validator->errors()->has('career_id')) {
                    return;
                }

                $career = Career::query()
                    ->with(['offerings' => static fn ($query) => $query
                        ->where('is_active', true)])
                    ->find($this->integer('career_id'));

                if ($career === null || ! $career->is_active) {
                    $validator->errors()->add(
                        'career_id',
                        'La carrera seleccionada no tiene admisión abierta.',
                    );

                    return;
                }

                $offerings = $career->offerings;

                if ($offerings->isEmpty()) {
                    $validator->errors()->add(
                        'career_id',
                        'La carrera seleccionada no tiene ofertas activas para esta convocatoria.',
                    );

                    return;
                }

                $modality = (string) $this->input('modality');
                $schedule = (string) $this->input('schedule');
                $shift = (string) $this->input('shift');

                if (! $offerings->contains(
                    static fn (CareerOffering $offering): bool => $offering->modality === $modality,
                )) {
                    $validator->errors()->add(
                        'modality',
                        'La modalidad seleccionada no está disponible para esta carrera.',
                    );

                    return;
                }

                if (! $offerings->contains(
                    static fn (CareerOffering $offering): bool => $offering->modality === $modality
                        && $offering->schedule === $schedule,
                )) {
                    $validator->errors()->add(
                        'schedule',
                        'El horario seleccionado no está disponible para esta carrera y modalidad.',
                    );

                    return;
                }

                if (! $offerings->contains(
                    static fn (CareerOffering $offering): bool => $offering->modality === $modality
                        && $offering->schedule === $schedule
                        && $offering->shift === $shift,
                )) {
                    $validator->errors()->add(
                        'shift',
                        'El turno seleccionado no está disponible para esta carrera, modalidad y horario.',
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'Indica tus nombres.',
            'last_name.required' => 'Indica tus apellidos.',
            'nationality.required' => 'Selecciona la nacionalidad de tu cédula.',
            'id_number.required' => 'Indica tu número de cédula.',
            'id_number.regex' => 'La cédula debe contener entre 5 y 9 dígitos.',
            'id_number.unique' => 'Ya existe una solicitud o un estudiante registrado con esta cédula.',
            'birth_date.required' => 'Indica tu fecha de nacimiento.',
            'birth_date.before_or_equal' => 'Debes tener al menos 15 años para preinscribirte.',
            'email.required' => 'Indica un correo electrónico.',
            'email.email' => 'El correo electrónico no es válido.',
            'email.unique' => 'Ya existe una cuenta o solicitud asociada a este correo.',
            'phone.required' => 'Indica un teléfono de contacto.',
            'phone.regex' => 'El teléfono solo puede contener números, espacios, guiones y paréntesis.',
            'career_id.required' => 'Selecciona la carrera de tu interés.',
            'career_id.exists' => 'La carrera seleccionada no existe.',
            'modality.required' => 'Selecciona la modalidad de estudio.',
            'schedule.required' => 'Selecciona el horario de estudio.',
            'shift.required' => 'Selecciona el turno de estudio.',
            'high_school.required' => 'Indica el plantel donde cursaste el bachillerato.',
            'high_school_year.required' => 'Indica el año de graduación de bachiller.',
            'high_school_year.max' => 'El año de graduación no puede ser futuro.',
            'high_school_average.required' => 'Indica tu promedio de bachillerato.',
            'high_school_average.between' => 'El promedio debe estar entre 0 y 20 puntos.',
            'terms.accepted' => 'Debes aceptar las condiciones del proceso de admisión.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'nombres',
            'last_name' => 'apellidos',
            'id_number' => 'cédula',
            'birth_date' => 'fecha de nacimiento',
            'email' => 'correo electrónico',
            'phone' => 'teléfono',
            'career_id' => 'carrera',
            'modality' => 'modalidad',
            'schedule' => 'horario',
            'shift' => 'turno',
            'high_school' => 'plantel de bachillerato',
            'high_school_year' => 'año de graduación',
            'high_school_average' => 'promedio de bachillerato',
        ];
    }
}
