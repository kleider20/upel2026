<?php

namespace App\Models;

use App\Support\AcademicOptions;
use App\Support\SubjectCode;
use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $career_id
 * @property string $code
 * @property string $name
 * @property int $semester
 * @property string $modality
 * @property string|null $component
 * @property string|null $type
 * @property bool $is_elective_slot
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
    'is_elective_slot',
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
            'is_elective_slot' => 'boolean',
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
     * Código y nombre de la materia en el formato de la planilla.
     */
    public function courseLabel(): string
    {
        return trim(sprintf('%s - %s', $this->code, $this->name));
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
     * Materias que conforman el pensum base de una carrera.
     *
     * Incluye las unidades curriculares regulares y los bloques de libre
     * elección del plan oficial, pero excluye las materias UNCLE concretas que
     * se ofertan en cada período: esas sustituyen a un bloque.
     *
     * @param  Builder<Subject>  $query
     * @return Builder<Subject>
     */
    public function scopePensumBase(Builder $query): Builder
    {
        return $query->where(function (Builder $query): void {
            $query->where('is_elective_slot', true)
                ->orWhereNull('type')
                ->orWhere('type', '!=', SubjectCode::ELECTIVE_TYPE);
        });
    }

    /**
     * Indica si la materia es una unidad curricular de libre elección.
     */
    public function isElective(): bool
    {
        return strtoupper(trim((string) $this->type)) === SubjectCode::ELECTIVE_TYPE;
    }

    /**
     * Indica si la materia es un bloque de libre elección del pensum base.
     */
    public function isElectiveSlot(): bool
    {
        return $this->isElective() && (bool) $this->is_elective_slot;
    }

    /**
     * Nombre genérico de un bloque de libre elección.
     *
     * Se usa mientras el estudiante no tiene asignada la materia concreta,
     * por ejemplo "Uncle Del Componente De Formación CFC UNCLE 2 2 4
     * Contextualizada".
     */
    public function electiveLabel(): string
    {
        return trim(sprintf(
            'Uncle Del Componente De Formación %s %s %d %d %d %s',
            (string) $this->component,
            strtoupper(trim((string) $this->type)),
            $this->credits,
            $this->theory_hours,
            $this->practice_hours,
            Str::ucfirst(AcademicOptions::componentDescriptor($this->component)),
        ));
    }

    /**
     * Código y nombre de la materia en el pensum base.
     *
     * Los bloques de libre elección no tienen código propio en la planilla
     * oficial, por eso se muestran en blanco.
     *
     * @return array{code: string, name: string}
     */
    public function pensumLabel(): array
    {
        return [
            'code' => $this->isElectiveSlot() ? '' : (string) $this->code,
            'name' => (string) $this->name,
        ];
    }

    /**
     * Etiqueta de la modalidad para la interfaz.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }
}
