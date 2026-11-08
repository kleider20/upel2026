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
        $isPhoto = $type === AdmissionDocumentType::Foto;
        $acceptedMimes = $type?->acceptedMimes() ?? ['pdf'];
        $fileTypeRules = $isPhoto ? ['image'] : [];

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
                ...$fileTypeRules,
                'mimes:'.implode(',', $acceptedMimes),
                'extensions:'.implode(',', $acceptedMimes),
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
        $uploadError = $this->file('document')?->getError();
        $uploadedMessage = match ($uploadError) {
            UPLOAD_ERR_INI_SIZE => 'El servidor rechazó el archivo porque supera el límite de carga de PHP. Reduce el tamaño del archivo o aumenta upload_max_filesize.',
            UPLOAD_ERR_FORM_SIZE => 'El archivo supera el límite de tamaño del formulario.',
            UPLOAD_ERR_PARTIAL => 'La carga del archivo se interrumpió. Inténtalo de nuevo.',
            UPLOAD_ERR_NO_TMP_DIR => 'El servidor no tiene disponible una carpeta temporal para recibir archivos.',
            UPLOAD_ERR_CANT_WRITE => 'El servidor no pudo escribir el archivo temporal. Revisa el espacio disponible y los permisos de la carpeta temporal.',
            UPLOAD_ERR_EXTENSION => 'Una extensión de PHP detuvo la carga del archivo.',
            default => 'No se pudo recibir el archivo. Inténtalo de nuevo o contacta al administrador.',
        };

        return [
            'type.required' => 'Selecciona el tipo de documento.',
            'type.in' => 'El tipo de documento no es válido.',
            'document.required' => 'Adjunta el archivo del documento.',
            'document.file' => 'El archivo adjunto no es válido.',
            'document.uploaded' => $uploadedMessage,
            'document.max' => 'El archivo supera el tamaño máximo permitido (5 MB).',
            'document.mimes' => 'El formato del archivo no es válido para este documento.',
            'document.extensions' => 'La extensión del archivo no es válida para este documento.',
            'document.image' => 'La fotografía tipo carnet debe ser una imagen JPG, JPEG o PNG.',
        ];
    }
}
