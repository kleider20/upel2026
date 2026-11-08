<?php

namespace App\Models;

use Database\Factories\StudentProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property-read Career|null $career
 * @property-read User $user
 * @property int $user_id
 * @property int|null $career_id
 * @property string $student_code
 * @property int $current_semester
 * @property string $status
 * @property string|null $phone
 * @property string|null $personal_email
 * @property string|null $address
 * @property Carbon|null $birth_date
 * @property string|null $birth_place
 * @property string|null $emergency_contact
 * @property string|null $shift
 * @property string|null $advisor
 * @property int|null $admission_year
 * @property int|null $graduation_year
 */
#[Fillable([
    'user_id',
    'career_id',
    'student_code',
    'current_semester',
    'status',
    'phone',
    'personal_email',
    'address',
    'birth_date',
    'birth_place',
    'emergency_contact',
    'shift',
    'advisor',
    'admission_year',
    'graduation_year',
])]
class StudentProfile extends Model
{
    /** @use HasFactory<StudentProfileFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'current_semester' => 'integer',
            'birth_date' => 'date',
            'admission_year' => 'integer',
            'graduation_year' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Career, $this>
     */
    public function career(): BelongsTo
    {
        return $this->belongsTo(Career::class);
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id', 'user_id');
    }

    /**
     * Solicitud de admisión que originó este perfil y su expediente documental.
     *
     * @return HasOne<Admission, $this>
     */
    public function admission(): HasOne
    {
        return $this->hasOne(Admission::class, 'converted_user_id', 'user_id');
    }

    /**
     * Etiqueta del estado académico.
     */
    public function statusLabel(): string
    {
        return match ($this->status) {
            'egresado' => 'Egresado',
            'preinscrito' => 'Preinscrito',
            'suspendido' => 'Suspendido',
            default => 'Activo',
        };
    }

    /**
     * Tono visual del estado académico.
     */
    public function statusTone(): string
    {
        return match ($this->status) {
            'egresado' => 'blue',
            'preinscrito' => 'amber',
            'suspendido' => 'red',
            default => 'green',
        };
    }

    /**
     * Indica si el perfil corresponde a un graduado.
     */
    public function isGraduate(): bool
    {
        return $this->status === 'egresado';
    }
}
