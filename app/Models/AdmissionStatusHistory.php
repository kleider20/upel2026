<?php

namespace App\Models;

use App\Enums\AdmissionStatus;
use Database\Factories\AdmissionStatusHistoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property-read User|null $changedBy
 * @property int $admission_id
 * @property string|null $from_status
 * @property string $to_status
 * @property string|null $note
 * @property int|null $changed_by
 */
#[Fillable([
    'admission_id',
    'from_status',
    'to_status',
    'note',
    'changed_by',
])]
class AdmissionStatusHistory extends Model
{
    /** @use HasFactory<AdmissionStatusHistoryFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Admission, $this>
     */
    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Etiqueta del estado anterior.
     */
    public function fromLabel(): string
    {
        return AdmissionStatus::tryFrom((string) $this->from_status)?->label()
            ?? 'Solicitud creada';
    }

    /**
     * Etiqueta del estado nuevo.
     */
    public function toLabel(): string
    {
        return AdmissionStatus::tryFrom($this->to_status)?->label()
            ?? $this->to_status;
    }

    /**
     * Tono visual del estado nuevo.
     */
    public function toTone(): string
    {
        return AdmissionStatus::tryFrom($this->to_status)?->tone() ?? 'slate';
    }
}
