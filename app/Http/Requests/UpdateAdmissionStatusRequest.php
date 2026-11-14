<?php

namespace App\Http\Requests;

use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Models\Admission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdmissionStatusRequest extends FormRequest
{
    /**
     * Pueden cambiar el estado los roles con gestión de admisiones o con el
     * permiso específico para actualizar el estado de una solicitud.
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
                Rule::in(array_map(
                    static fn (AdmissionStatus $status): string => $status->value,
                    AdmissionStatus::reviewable(),
                )),
            ],
            'note' => ['nullable', 'string', 'max:1000', 'required_if:status,observada,rechazada'],
        ];
    }

    /**
     * Valida la transición y que el expediente esté completo para aprobar.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('status')) {
                    return;
                }

                $admission = $this->route('admission');

                if (! $admission instanceof Admission) {
                    return;
                }

                $target = AdmissionStatus::tryFrom((string) $this->input('status'));

                if ($target === null) {
                    return;
                }

                if (! $admission->statusEnum()->canTransitionTo($target)) {
                    $validator->errors()->add(
                        'status',
                        'No es posible pasar de "'.$admission->statusLabel().'" a "'.$target->label().'".',
                    );

                    return;
                }

                if ($target === AdmissionStatus::Aprobada && ! $admission->hasCompleteDocuments()) {
                    $validator->errors()->add(
                        'status',
                        'Debes recibir todos los documentos obligatorios antes de aprobar la solicitud.',
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
            'status.required' => 'Selecciona el nuevo estado de la solicitud.',
            'status.in' => 'El estado seleccionado no es válido.',
            'note.required_if' => 'Explica el motivo de la observación o del rechazo.',
        ];
    }
}
