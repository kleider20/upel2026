<?php

namespace App\Models;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use Database\Factories\AdmissionDocumentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $admission_id
 * @property string $type
 * @property string $status
 * @property string $original_name
 * @property string $path
 * @property string|null $mime_type
 * @property int $size
 * @property string|null $notes
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 */
#[Fillable([
    'admission_id',
    'type',
    'status',
    'original_name',
    'path',
    'mime_type',
    'size',
    'notes',
    'reviewed_by',
    'reviewed_at',
])]
class AdmissionDocument extends Model
{
    /** @use HasFactory<AdmissionDocumentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

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
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Tipo de documento tipado.
     */
    public function typeEnum(): AdmissionDocumentType
    {
        return AdmissionDocumentType::tryFrom($this->type) ?? AdmissionDocumentType::Cedula;
    }

    /**
     * Estado de revisión tipado.
     */
    public function statusEnum(): AdmissionDocumentStatus
    {
        return AdmissionDocumentStatus::tryFrom($this->status) ?? AdmissionDocumentStatus::Pendiente;
    }

    /**
     * Etiqueta del tipo de documento.
     */
    public function typeLabel(): string
    {
        return $this->typeEnum()->label();
    }

    /**
     * Etiqueta del estado de revisión.
     */
    public function statusLabel(): string
    {
        return $this->statusEnum()->label();
    }

    /**
     * Tono visual del estado de revisión.
     */
    public function statusTone(): string
    {
        return $this->statusEnum()->tone();
    }

    /**
     * Tamaño legible para la interfaz.
     */
    public function humanSize(): string
    {
        $size = (int) $this->size;

        if ($size >= 1_048_576) {
            return number_format($size / 1_048_576, 1, ',', '.').' MB';
        }

        return number_format(max(1, (int) round($size / 1024)), 0, ',', '.').' KB';
    }

    /**
     * Indica si el archivo puede previsualizarse en el navegador.
     */
    public function isPreviewable(): bool
    {
        return in_array($this->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
        ], true);
    }
}
