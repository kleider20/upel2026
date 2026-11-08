<?php

namespace App\Http\Requests;

use App\Support\AdmissionIdentity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class CheckAdmissionIdentityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_number' => ['required_without:email', 'nullable', 'string', 'regex:/^\d{5,9}$/'],
            'email' => ['required_without:id_number', 'nullable', 'email', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_number' => preg_replace('/\D/', '', (string) $this->input('id_number')) ?? '',
            'email' => Str::lower(trim((string) $this->input('email'))),
        ]);
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $duplicateErrors = AdmissionIdentity::duplicateErrors(
                    $validator->errors()->has('id_number') ? null : $this->input('id_number'),
                    $validator->errors()->has('email') ? null : $this->input('email'),
                );

                foreach ($duplicateErrors as $field => $message) {
                    $validator->errors()->add($field, $message);
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
            'id_number.required_without' => 'Indica tu número de cédula.',
            'id_number.regex' => 'La cédula debe contener entre 5 y 9 dígitos.',
            'email.required_without' => 'Indica un correo electrónico.',
            'email.email' => 'El correo electrónico no es válido.',
        ];
    }
}
