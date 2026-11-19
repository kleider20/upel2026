<?php

namespace App\Models;

use Database\Factories\BannerSlideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * Publicación del baner principal de la landing pública.
 *
 * Cada registro controla el texto de una diapositiva y la tarjeta decorativa
 * que se muestra a su lado. El orden y el estado determinan qué se publica.
 *
 * @property int $id
 * @property string $tag
 * @property string $title_start
 * @property string $title_highlight
 * @property string|null $title_end
 * @property string $description
 * @property string $visual
 * @property string|null $image_path
 * @property string|null $countdown_at
 * @property string|null $countdown_label
 * @property string|null $primary_label
 * @property string|null $primary_url
 * @property string|null $secondary_label
 * @property string|null $secondary_url
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable([
    'tag',
    'title_start',
    'title_highlight',
    'title_end',
    'description',
    'visual',
    'image_path',
    'countdown_at',
    'countdown_label',
    'primary_label',
    'primary_url',
    'secondary_label',
    'secondary_url',
    'sort_order',
    'is_active',
])]
class BannerSlide extends Model
{
    /** @use HasFactory<BannerSlideFactory> */
    use HasFactory;

    public const VISUAL_IMAGEN = 'imagen';

    public const VISUAL_COUNTDOWN = 'countdown';

    /**
     * Tarjetas decorativas disponibles, con su etiqueta para el formulario.
     *
     * @return array<string, string>
     */
    public static function visualOptions(): array
    {
        return [
            self::VISUAL_IMAGEN => 'Imagen del banner',
            self::VISUAL_COUNTDOWN => 'Cuenta regresiva',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function visuals(): array
    {
        return array_keys(self::visualOptions());
    }

    /**
     * Etiqueta legible de la tarjeta seleccionada.
     */
    public function visualLabel(): string
    {
        return self::visualOptions()[$this->visual] ?? 'Imagen del banner';
    }

    /**
     * URL pública de la imagen subida para la diapositiva.
     */
    public function imageUrl(): ?string
    {
        return $this->image_path !== null
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
