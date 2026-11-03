<?php

namespace App\Models;

use App\Support\AcademicOptions;
use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $career_id
 * @property string $code
 * @property string $name
 * @property int $semester
 * @property string $modality
 * @property string|null $component
 * @property string|null $type
 * @property string|null $area
 * @property string|null $level
 * @property int $credits
 * @property int $theory_hours
 * @property int $practice_hours
 * @property string|null $prerequisites
 * @property bool $is_active
 */
#[Fillable([
    'career_id',
    'code',
    'name',
    'semester',
    'modality',
    'component',
    'type',
    'area',
    'level',
    'credits',
    'theory_hours',
    'practice_hours',
    'prerequisites',
    'is_active',
])]
class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory;

    /**
     * Nota mínima aprobatoria sobre la escala de 0 a 10.
     */
    public const PASSING_GRADE = 5.0;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'credits' => 'integer',
            'theory_hours' => 'integer',
            'practice_hours' => 'integer',
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
     * @return BelongsToMany<User, $this>
     */
    public function professors(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'professor_subjects',
            'subject_id',
            'professor_id',
        )->withTimestamps();
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * @param  Builder<Subject>  $query
     * @return Builder<Subject>
     */
    public function scopeForCareer(Builder $query, int $careerId): Builder
    {
        return $query->where('career_id', $careerId);
    }

    /**
     * Etiqueta de la modalidad para la interfaz.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }
}
