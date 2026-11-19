<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\NewsPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NewsPostRequest extends FormRequest
{
    /**
     * Solo los roles con permiso de gestión pueden publicar noticias.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::NewsManage->value) ?? false;
    }

    /**
     * Normaliza los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'category' => trim((string) $this->input('category')),
            'date' => trim((string) $this->input('date')),
            'title' => trim((string) $this->input('title')),
            'excerpt' => trim((string) $this->input('excerpt')),
            'icon' => trim((string) $this->input('icon')),
            'link_url' => $this->filled('link_url')
                ? trim((string) $this->input('link_url'))
                : null,
            'sort_order' => (int) $this->input('sort_order', 0),
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'category' => ['required', 'string', 'max:80'],
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'excerpt' => ['required', 'string', 'max:600'],
            'icon' => ['required', Rule::in(NewsPost::icons())],
            'link_url' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^(#|\/|https?:\/\/)/',
            ],
            'sort_order' => ['integer', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category.required' => 'Indica la categoría de la noticia.',
            'date.required' => 'Indica la fecha de publicación.',
            'date.date' => 'La fecha de publicación no es válida.',
            'title.required' => 'Indica el título de la noticia.',
            'excerpt.required' => 'Indica el resumen de la noticia.',
            'icon.required' => 'Selecciona la ilustración de la noticia.',
            'icon.in' => 'La ilustración seleccionada no es válida.',
            'link_url.regex' => 'El enlace debe empezar con #, /, http:// o https://.',
        ];
    }
}
