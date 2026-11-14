<?php

namespace App\Http\Requests;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAdmissionDocumentRequest extends FormRequest
{
    /**
     * Pueden validar documentos los roles con gestión de admisiones o con el
     * permiso específico de revisión de solicitudes.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::AdmissionsManage->value) === true
            || $this->user()?->can(Permission::AdmissionsReview->value) === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    AdmissionDocumentStatus::Validado->value,
                    AdmissionDocumentStatus::Rechazado->value,
                ]),
            ],
            'notes' => ['nullable', 'string', 'max:500', 'required_if:status,rechazado'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Selecciona el resultado de la revisión.',
            'notes.required_if' => 'Indica el motivo por el cual rechazas el documento.',
        ];
    }
}
