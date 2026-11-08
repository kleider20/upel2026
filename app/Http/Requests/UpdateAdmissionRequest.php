<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\Admission;
use App\Models\CareerOffering;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdmissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Admission|null $admission */
        $admission = $this->route('admission');

        return (bool) $this->user()?->can(Permission::AdmissionsEdit->value)
            && $admission !== null
            && $admission->converted_user_id === null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Admission $admission */
        $admission = $this->route('admission');

        return [
            'first_name' => ['required', 'string', 'min:2', 'max:80'],
            'last_name' => ['required', 'string', 'min:2', 'max:80'],
            'nationality' => ['required', Rule::in(['V', 'E'])],
            'id_number' => [
                'required',
                'string',
                'regex:/^\d{5,9}$/',
                Rule::unique('admissions', 'id_number')
                    ->where(fn ($query) => $query->where('period_year', $admission->period_year))
                    ->ignore($admission->id),
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
                    ->where(fn ($query) => $query->where('period_year', $admission->period_year))
                    ->ignore($admission->id),
            ],
            'phone' => ['required', 'string', 'regex:/^[0-9+()\-\s]{7,30}$/'],
            'address' => ['nullable', 'string', 'max:500'],
            'career_id' => ['required', 'integer', 'exists:careers,id'],
            'modality' => ['required', Rule::in(['presencial', 'online', 'mixta'])],
            'schedule' => ['required', Rule::in(['lunes_viernes', 'sabatino'])],
            'shift' => ['required', Rule::in(['diurno', 'nocturno'])],
            'high_school' => ['required', 'string', 'min:3', 'max:200'],
            'high_school_year' => ['required', 'integer', 'min:1980', 'max:'.now()->year],
            'high_school_average' => ['required', 'numeric', 'min:0', 'max:20'],
        ];
    }

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
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('id_number')) {
                    return;
                }

                /** @var Admission $admission */
                $admission = $this->route('admission');

                if ($admission->documents()->exists()
                    && preg_replace('/\D/', '', (string) $this->input('id_number')) !== $admission->id_number) {
                    $validator->errors()->add(
                        'id_number',
                        'No puedes cambiar la cédula mientras la solicitud tenga documentos cargados.',
                    );
                }

                if (! $validator->errors()->has('id_number')
                    && Admission::query()
                        ->whereNotNull('converted_user_id')
                        ->where('id_number', $this->input('id_number'))
                        ->exists()) {
                    $validator->errors()->add(
                        'id_number',
                        'Ya existe un estudiante registrado con esta cédula.',
                    );
                }
            },
            function (Validator $validator): void {
                if ($validator->errors()->hasAny([
                    'career_id',
                    'modality',
                    'schedule',
                    'shift',
                ])) {
                    return;
                }

                /** @var Admission $admission */
                $admission = $this->route('admission');
                $careerId = $this->integer('career_id');
                $modality = $this->string('modality')->toString();
                $schedule = $this->string('schedule')->toString();
                $shift = $this->string('shift')->toString();
                $unchangedOffering = $careerId === $admission->career_id
                    && $modality === $admission->modality
                    && $schedule === $admission->schedule
                    && $shift === $admission->shift;

                if (! $unchangedOffering && ! CareerOffering::query()
                    ->where('career_id', $careerId)
                    ->where('modality', $modality)
                    ->where('schedule', $schedule)
                    ->where('shift', $shift)
                    ->where('is_active', true)
                    ->exists()) {
                    $validator->errors()->add(
                        'shift',
                        'La combinación de carrera, modalidad, horario y turno no está disponible.',
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
            'id_number.unique' => 'Ya existe otra solicitud con esta cédula para la misma convocatoria.',
            'id_number.regex' => 'La cédula debe contener entre 5 y 9 dígitos.',
            'email.unique' => 'Ya existe una solicitud o cuenta asociada a este correo.',
            'birth_date.before_or_equal' => 'El aspirante debe tener al menos 15 años.',
            'high_school_year.max' => 'El año de graduación no puede ser futuro.',
            'high_school_average.max' => 'El promedio debe estar entre 0 y 20 puntos.',
        ];
    }
}
