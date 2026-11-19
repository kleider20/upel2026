<?php

namespace App\Models;

use Database\Factories\NewsPostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Noticia o novedad institucional publicada en la landing.
 *
 * @property int $id
 * @property string $category
 * @property Carbon $date
 * @property string $title
 * @property string $excerpt
 * @property string $icon
 * @property string|null $link_url
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable([
    'category',
    'date',
    'title',
    'excerpt',
    'icon',
    'link_url',
    'sort_order',
    'is_active',
])]
class NewsPost extends Model
{
    /** @use HasFactory<NewsPostFactory> */
    use HasFactory;

    public const ICON_LAPTOP = 'laptop';

    public const ICON_GRADUATION = 'graduation';

    public const ICON_GLOBE = 'globe';

    public const ICON_TROPHY = 'trophy';

    public const ICON_HANDSHAKE = 'handshake';

    public const ICON_CALENDAR = 'calendar';

    /**
     * Ilustraciones disponibles, con su etiqueta para el formulario.
     *
     * @return array<string, string>
     */
    public static function iconOptions(): array
    {
        return [
            self::ICON_LAPTOP => 'Tecnología',
            self::ICON_GRADUATION => 'Graduación',
            self::ICON_GLOBE => 'Internacional',
            self::ICON_TROPHY => 'Logro',
            self::ICON_HANDSHAKE => 'Alianza',
            self::ICON_CALENDAR => 'Evento',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function icons(): array
    {
        return array_keys(self::iconOptions());
    }

    /**
     * Etiqueta legible de la ilustración seleccionada.
     */
    public function iconLabel(): string
    {
        return self::iconOptions()[$this->icon] ?? self::iconOptions()[self::ICON_LAPTOP];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
