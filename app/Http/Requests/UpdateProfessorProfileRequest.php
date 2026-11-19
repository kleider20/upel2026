<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfessorProfileRequest extends FormRequest
{
    /**
     * Solo el docente dueño del perfil puede actualizarlo.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->isProfessor();
    }

    /**
     * Limpia los espacios de los campos públicos opcionales.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'position' => $this->filled('position')
                ? trim((string) $this->input('position'))
                : null,
            'department' => $this->filled('department')
                ? trim((string) $this->input('department'))
                : null,
            'academic_title' => $this->filled('academic_title')
                ? trim((string) $this->input('academic_title'))
                : null,
            'bio' => $this->filled('bio')
                ? trim((string) $this->input('bio'))
                : null,
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'position' => ['nullable', 'string', 'max:120'],
            'department' => ['nullable', 'string', 'max:255'],
            'academic_title' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:800'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'position.max' => 'El cargo no puede superar los 120 caracteres.',
            'bio.max' => 'La reseña no puede superar los 800 caracteres.',
            'photo.image' => 'La fotografía debe ser una imagen.',
            'photo.mimes' => 'La fotografía debe ser JPG, PNG o WEBP.',
            'photo.max' => 'La fotografía no puede superar los 2 MB.',
        ];
    }
}
