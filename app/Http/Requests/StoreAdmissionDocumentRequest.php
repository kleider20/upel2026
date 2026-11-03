<?php

namespace App\Http\Requests;

use App\Enums\AdmissionDocumentType;
use App\Models\Admission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAdmissionDocumentRequest extends FormRequest
{
    /**
     * El aspirante accede mediante un enlace firmado.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $type = AdmissionDocumentType::tryFrom((string) $this->input('type'));
        $mimes = $type !== null
            ? implode(',', $type->acceptedMimes())
            : 'pdf,jpg,jpeg,png';

        return [
            'type' => [
                'required',
                Rule::in(array_map(
                    static fn (AdmissionDocumentType $type): string => $type->value,
                    AdmissionDocumentType::cases(),
                )),
            ],
            'document' => [
                'required',
                'file',
                'max:'.(int) config('admissions.documents.max_kb'),
                'mimes:'.$mimes,
            ],
        ];
    }

    /**
     * Comprueba que la solicitud todavía admita documentos.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $admission = $this->route('admission');

                if (! $admission instanceof Admission) {
                    return;
                }

                if (! $admission->statusEnum()->allowsDocumentUpload()) {
                    $validator->errors()->add(
                        'document',
                        'Esta solicitud ya no admite cambios en los documentos.',
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
            'type.required' => 'Selecciona el tipo de documento.',
            'type.in' => 'El tipo de documento no es válido.',
            'document.required' => 'Adjunta el archivo del documento.',
            'document.file' => 'El documento no pudo cargarse.',
            'document.max' => 'El archivo supera el tamaño máximo permitido (5 MB).',
            'document.mimes' => 'El formato del archivo no es válido para este documento.',
        ];
    }
}
