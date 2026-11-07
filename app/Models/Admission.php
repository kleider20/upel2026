<?php

namespace App\Models;

use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Support\AcademicOptions;
use Database\Factories\AdmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

/**
 * @property int $id
 * @property-read Career|null $career
 * @property-read User|null $convertedUser
 * @property string $code
 * @property int $period_year
 * @property string $first_name
 * @property string $last_name
 * @property string $nationality
 * @property string $id_number
 * @property Carbon $birth_date
 * @property string|null $gender
 * @property string $email
 * @property string $phone
 * @property string|null $address
 * @property int|null $career_id
 * @property string $modality
 * @property string|null $schedule
 * @property string|null $shift
 * @property string $high_school
 * @property int $high_school_year
 * @property string $high_school_average
 * @property string $status
 * @property string|null $review_notes
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property int|null $converted_user_id
 * @property Carbon|null $converted_at
 * @property Carbon|null $submitted_at
 */
#[Fillable([
    'code',
    'period_year',
    'first_name',
    'last_name',
    'nationality',
    'id_number',
    'birth_date',
    'gender',
    'email',
    'phone',
    'address',
    'career_id',
    'modality',
    'schedule',
    'shift',
    'high_school',
    'high_school_year',
    'high_school_average',
    'status',
    'review_notes',
    'reviewed_by',
    'reviewed_at',
    'converted_user_id',
    'converted_at',
    'submitted_at',
])]
class Admission extends Model
{
    /** @use HasFactory<AdmissionFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_year' => 'integer',
            'birth_date' => 'date',
            'high_school_year' => 'integer',
            'high_school_average' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'converted_at' => 'datetime',
            'submitted_at' => 'datetime',
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
     * @return HasMany<AdmissionDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(AdmissionDocument::class);
    }

    /**
     * @return HasMany<AdmissionStatusHistory, $this>
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(AdmissionStatusHistory::class)->latest();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function convertedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_user_id');
    }

    /**
     * Estado tipado de la solicitud.
     */
    public function statusEnum(): AdmissionStatus
    {
        return AdmissionStatus::tryFrom($this->status) ?? AdmissionStatus::Recibida;
    }

    /**
     * Etiqueta del estado.
     */
    public function statusLabel(): string
    {
        return $this->statusEnum()->label();
    }

    /**
     * Tono visual del estado.
     */
    public function statusTone(): string
    {
        return $this->statusEnum()->tone();
    }

    /**
     * Nombre completo del aspirante.
     */
    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    /**
     * Cédula con formato venezolano.
     */
    public function formattedIdNumber(): string
    {
        return $this->nationality.'-'.$this->id_number;
    }

    /**
     * Edad calculada a la fecha actual.
     */
    public function age(): int
    {
        return (int) $this->birth_date->age;
    }

    /**
     * Etiqueta de la modalidad solicitada.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }

    /**
     * Etiqueta del horario solicitado.
     */
    public function scheduleLabel(): string
    {
        return $this->schedule === null
            ? 'No registrado'
            : AcademicOptions::scheduleLabel($this->schedule);
    }

    /**
     * Etiqueta del turno solicitado.
     */
    public function shiftLabel(): string
    {
        return AcademicOptions::shiftLabel($this->shift);
    }

    /**
     * Documentos indexados por tipo.
     *
     * @return array<string, AdmissionDocument>
     */
    public function documentsByType(): array
    {
        return $this->documents->keyBy(
            static fn (AdmissionDocument $document): string => $document->type,
        )->all();
    }

    /**
     * Tipos obligatorios que aún no tienen un documento aceptado.
     *
     * @return array<int, AdmissionDocumentType>
     */
    public function missingRequiredDocuments(): array
    {
        $uploaded = $this->documents
            ->where('status', '!=', 'rechazado')
            ->pluck('type')
            ->all();

        return array_values(array_filter(
            AdmissionDocumentType::cases(),
            static fn (AdmissionDocumentType $type): bool => $type->isRequired()
                && ! in_array($type->value, $uploaded, true),
        ));
    }

    /**
     * Indica si el expediente está listo para aprobarse.
     */
    public function hasCompleteDocuments(): bool
    {
        return $this->missingRequiredDocuments() === [];
    }

    /**
     * Indica si la solicitud puede convertirse en estudiante.
     */
    public function canBeConverted(): bool
    {
        return $this->statusEnum() === AdmissionStatus::Aprobada
            && $this->converted_user_id === null;
    }

    /**
     * Enlace firmado para que el aspirante consulte su solicitud.
     */
    public function trackingUrl(int $days = 60): string
    {
        return URL::temporarySignedRoute(
            'admissions.show',
            now()->addDays($days),
            ['admission' => $this->code],
        );
    }

    /**
     * Filtra por estado de la solicitud.
     *
     * @param  Builder<Admission>  $query
     * @return Builder<Admission>
     */
    public function scopeOfStatus(Builder $query, ?string $status): Builder
    {
        return $status !== null && $status !== ''
            ? $query->where('status', $status)
            : $query;
    }

    /**
     * Busca por código, cédula, nombre o correo.
     *
     * @param  Builder<Admission>  $query
     * @return Builder<Admission>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $query) use ($term): void {
            $query
                ->where('code', 'like', "%{$term}%")
                ->orWhere('id_number', 'like', "%{$term}%")
                ->orWhere('first_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%");
        });
    }

    /**
     * Genera el siguiente código de aspirante del período.
     */
    public static function nextCode(int $year): string
    {
        $prefix = sprintf('ASP-%d-', $year);

        $lastCode = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $sequence = $lastCode !== null
            ? ((int) substr($lastCode, strlen($prefix))) + 1
            : 1;

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
