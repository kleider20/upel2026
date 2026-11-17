<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Date;

/**
 * Configuración única de la ventana de inscripciones en línea.
 *
 * @property int $id
 * @property Carbon $opens_on
 * @property Carbon $closes_on
 * @property string $mode
 */
#[Fillable(['opens_on', 'closes_on', 'mode'])]
class AdmissionWindowSetting extends Model
{
    /**
     * Zona horaria oficial del proceso de admisión.
     */
    public const TIMEZONE = 'America/Caracas';

    /**
     * La ventana se abre y se cierra automáticamente según las fechas.
     */
    public const MODE_AUTOMATIC = 'automatic';

    /**
     * El administrador o el decano forzaron la apertura.
     */
    public const MODE_OPEN = 'open';

    /**
     * El administrador o el decano forzaron el cierre.
     */
    public const MODE_CLOSED = 'closed';

    /**
     * Modos disponibles para la ventana.
     *
     * @return array<int, string>
     */
    public static function modes(): array
    {
        return [
            self::MODE_AUTOMATIC,
            self::MODE_OPEN,
            self::MODE_CLOSED,
        ];
    }

    /**
     * Registro vigente; se crea con las fechas oficiales del archivo de
     * configuración la primera vez que se consulta.
     */
    public static function current(): self
    {
        return self::query()->firstOrCreate([], [
            'opens_on' => Date::parse((string) config('admissions.opens_at'))
                ->timezone(self::TIMEZONE)
                ->toDateString(),
            'closes_on' => Date::parse((string) config('admissions.closes_at'))
                ->timezone(self::TIMEZONE)
                ->toDateString(),
            'mode' => self::MODE_AUTOMATIC,
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opens_on' => 'date',
            'closes_on' => 'date',
        ];
    }
}
