<?php

namespace App\Models;

use App\Support\AcademicOptions;
use Database\Factories\CareerOfferingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $career_id
 * @property string $modality
 * @property string $schedule
 * @property string $shift
 * @property bool $is_active
 */
#[Fillable(['career_id', 'modality', 'schedule', 'shift', 'is_active'])]
class CareerOffering extends Model
{
    /** @use HasFactory<CareerOfferingFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Career, $this>
     */
    public function career(): BelongsTo
    {
        return $this->belongsTo(Career::class);
    }

    /**
     * Etiqueta de la modalidad para la interfaz.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }

    /**
     * Etiqueta del horario para la interfaz.
     */
    public function scheduleLabel(): string
    {
        return AcademicOptions::scheduleLabel($this->schedule);
    }

    /**
     * Etiqueta del turno para la interfaz.
     */
    public function shiftLabel(): string
    {
        return AcademicOptions::shiftLabel($this->shift);
    }
}
