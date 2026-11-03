<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class LookupAdmissionRequest extends FormRequest
{
    /**
     * La consulta de estado es pública.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza el correo y la cédula.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => Str::lower(trim((string) $this->input('email'))),
            'id_number' => preg_replace('/\D/', '', (string) $this->input('id_number')) ?? '',
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'id_number' => ['required', 'string', 'regex:/^\d{5,9}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Indica el correo electrónico con el que te registraste.',
            'email.email' => 'El correo electrónico no es válido.',
            'id_number.required' => 'Indica el número de cédula con el que te registraste.',
            'id_number.regex' => 'La cédula debe contener entre 5 y 9 dígitos.',
        ];
    }
}
