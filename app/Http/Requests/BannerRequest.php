<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use App\Models\BannerSlide;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;

class BannerRequest extends FormRequest
{
    /**
     * Solo los roles con permiso de gestión pueden publicar en el baner.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(Permission::BannersManage->value) ?? false;
    }

    /**
     * Normaliza los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $nullable = fn (string $key): ?string => $this->filled($key)
            ? trim((string) $this->input($key))
            : null;

        $this->merge([
            'tag' => trim((string) $this->input('tag')),
            'title_start' => trim((string) $this->input('title_start')),
            'title_highlight' => trim((string) $this->input('title_highlight')),
            'title_end' => $nullable('title_end'),
            'description' => trim((string) $this->input('description')),
            'visual' => trim((string) $this->input('visual')),
            'countdown_at' => $this->filled('countdown_at')
                ? $this->normalizeCountdownAt((string) $this->input('countdown_at'))
                : null,
            'countdown_label' => $nullable('countdown_label'),
            'primary_label' => $nullable('primary_label'),
            'primary_url' => $nullable('primary_url'),
            'secondary_label' => $nullable('secondary_label'),
            'secondary_url' => $nullable('secondary_url'),
            'sort_order' => (int) $this->input('sort_order', 0),
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * Normaliza el `datetime-local` del formulario; un valor inválido se deja
     * tal cual para que la regla `date` lo rechace sin lanzar una excepción.
     */
    private function normalizeCountdownAt(string $value): string
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $value)) {
            return $value;
        }

        try {
            return Date::parse($value, 'America/Caracas')->toIso8601String();
        } catch (\Throwable) {
            return $value;
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $safeUrl = ['nullable', 'string', 'max:255', 'regex:/^(#|\/|https?:\/\/)/'];

        return [
            'tag' => ['required', 'string', 'max:120'],
            'title_start' => ['required', 'string', 'max:120'],
            'title_highlight' => ['required', 'string', 'max:120'],
            'title_end' => ['nullable', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:600'],
            'visual' => ['required', Rule::in(BannerSlide::visuals())],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
            'countdown_at' => ['nullable', 'date'],
            'countdown_label' => ['nullable', 'string', 'max:120'],
            'primary_label' => ['nullable', 'string', 'max:60'],
            'primary_url' => $safeUrl,
            'secondary_label' => ['nullable', 'string', 'max:60'],
            'secondary_url' => $safeUrl,
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
            'tag.required' => 'Indica la etiqueta de la publicación.',
            'title_start.required' => 'Indica el inicio del título.',
            'title_highlight.required' => 'Indica el texto destacado del título.',
            'description.required' => 'Indica la descripción de la publicación.',
            'visual.required' => 'Selecciona la tarjeta decorativa.',
            'visual.in' => 'La tarjeta decorativa seleccionada no es válida.',
            'image.image' => 'El archivo debe ser una imagen.',
            'image.mimes' => 'La imagen debe ser JPG, PNG o WEBP.',
            'image.max' => 'La imagen no puede superar los 2 MB.',
            'primary_url.regex' => 'El enlace debe empezar con #, /, http:// o https://.',
            'secondary_url.regex' => 'El enlace debe empezar con #, /, http:// o https://.',
            'sort_order.min' => 'El orden no puede ser negativo.',
        ];
    }
}
