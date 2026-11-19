<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\AdmissionWindowSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdmissionWindowRequest extends FormRequest
{
    /**
     * Solo el administrador del sistema y el decano pueden habilitar o
     * deshabilitar las preinscripciones.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::AdmissionsWindow->value) === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'opens_on' => ['required', 'date'],
            'closes_on' => ['required', 'date', 'after_or_equal:opens_on'],
            'mode' => ['required', Rule::in(AdmissionWindowSetting::modes())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'opens_on.required' => 'Indica la fecha de inicio de las preinscripciones.',
            'opens_on.date' => 'La fecha de inicio no es válida.',
            'closes_on.required' => 'Indica la fecha de cierre de las preinscripciones.',
            'closes_on.date' => 'La fecha de cierre no es válida.',
            'closes_on.after_or_equal' => 'La fecha de cierre debe ser igual o posterior a la fecha de inicio.',
            'mode.required' => 'Selecciona el estado de las preinscripciones.',
            'mode.in' => 'El estado seleccionado no es válido.',
        ];
    }
}
