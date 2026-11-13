<?php

namespace App\Models;

use App\Support\AcademicOptions;
use Database\Factories\CareerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property string $degree
 * @property string|null $icon
 * @property string|null $image_path
 * @property string $modality
 * @property int $duration_semesters
 * @property bool $is_active
 */
#[Fillable([
    'name',
    'code',
    'description',
    'degree',
    'icon',
    'image_path',
    'modality',
    'duration_semesters',
    'is_active',
])]
class Career extends Model
{
    /** @use HasFactory<CareerFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_semesters' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Subject, $this>
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * @return HasMany<CareerOffering, $this>
     */
    public function offerings(): HasMany
    {
        return $this->hasMany(CareerOffering::class);
    }

    /**
     * @return HasMany<StudentProfile, $this>
     */
    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    /**
     * Etiqueta de la modalidad para la interfaz.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }

    /**
     * URL pública de la imagen de la carrera, si tiene una.
     */
    public function imageUrl(): ?string
    {
        return $this->image_path !== null
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }
}
