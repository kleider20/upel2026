<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\Career;
use App\Support\AcademicOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CareerRequest extends FormRequest
{
    /**
     * Solo los roles con permiso de gestión pueden crear o editar carreras.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::CareersManage->value) ?? false;
    }

    /**
     * Normaliza los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $description = trim((string) $this->input('description'));

        $offeringsInput = $this->input('offerings', []);
        $offerings = collect(is_array($offeringsInput) ? $offeringsInput : [])
            ->filter(static fn (mixed $offering): bool => is_array($offering))
            ->map(static fn (array $offering): array => [
                'modality' => trim((string) ($offering['modality'] ?? '')),
                'schedule' => trim((string) ($offering['schedule'] ?? '')),
                'shift' => trim((string) ($offering['shift'] ?? '')),
                'is_active' => filter_var(
                    $offering['is_active'] ?? true,
                    FILTER_VALIDATE_BOOLEAN,
                ),
            ])
            ->values()
            ->all();

        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code'))),
            'name' => trim((string) $this->input('name')),
            'description' => $description !== '' ? $description : null,
            'offerings' => $offerings,
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Career|null $career */
        $career = $this->route('career');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('careers', 'code')->ignore($career?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_semesters' => ['required', 'integer', 'min:1', 'max:12'],
            'is_active' => ['boolean'],
            'offerings' => ['required', 'array', 'min:1'],
            'offerings.*.modality' => [
                'required',
                Rule::in(array_keys(AcademicOptions::MODALITIES)),
            ],
            'offerings.*.schedule' => [
                'required',
                Rule::in(array_keys(AcademicOptions::SCHEDULES)),
            ],
            'offerings.*.shift' => [
                'required',
                Rule::in(array_keys(AcademicOptions::SHIFTS)),
            ],
            'offerings.*.is_active' => ['boolean'],
        ];
    }

    /**
     * Evita ofertas duplicadas con la misma modalidad, horario y turno.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $combinations = [];

            foreach ($this->input('offerings', []) as $index => $offering) {
                $key = implode('|', [
                    $offering['modality'] ?? '',
                    $offering['schedule'] ?? '',
                    $offering['shift'] ?? '',
                ]);

                if (isset($combinations[$key])) {
                    $validator->errors()->add(
                        "offerings.{$index}.modality",
                        'Esta combinación de modalidad, horario y turno ya está registrada.',
                    );
                }

                $combinations[$key] = true;
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Indica el nombre de la carrera.',
            'code.required' => 'Indica el código de la carrera.',
            'code.unique' => 'Ya existe una carrera con ese código.',
            'duration_semesters.required' => 'Indica la duración en periodos.',
            'duration_semesters.min' => 'La duración debe ser al menos 1 periodo.',
            'duration_semesters.max' => 'La duración no puede ser mayor a 12 periodos.',
            'offerings.required' => 'Agrega al menos una oferta académica.',
            'offerings.min' => 'Agrega al menos una oferta académica.',
            'offerings.*.modality.required' => 'Selecciona la modalidad de la oferta.',
            'offerings.*.modality.in' => 'La modalidad seleccionada no es válida.',
            'offerings.*.schedule.required' => 'Selecciona el horario de la oferta.',
            'offerings.*.schedule.in' => 'El horario seleccionado no es válido.',
            'offerings.*.shift.required' => 'Selecciona el turno de la oferta.',
            'offerings.*.shift.in' => 'El turno seleccionado no es válido.',
        ];
    }
}
