<?php

namespace App\Models;

use Database\Factories\ProfessorProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $employee_code
 * @property string|null $identity_document
 * @property string|null $department
 * @property string|null $academic_title
 * @property string|null $position
 * @property string|null $bio
 * @property string|null $photo_path
 */
#[Fillable(['user_id', 'employee_code', 'identity_document', 'department', 'academic_title', 'position', 'bio', 'photo_path'])]
class ProfessorProfile extends Model
{
    /** @use HasFactory<ProfessorProfileFactory> */
    use HasFactory;

    /**
     * URL pública de la fotografía tipo carnet del docente. Se construye como
     * ruta raíz relativa para que funcione en cualquier dominio (Herd, testing
     * y producción) sin depender de APP_URL.
     */
    public function photoUrl(): ?string
    {
        return $this->photo_path !== null
            ? '/storage/'.ltrim($this->photo_path, '/')
            : null;
    }

    /**
     * Cargo o distinción que se muestra en la landing.
     */
    public function landingRole(): string
    {
        return $this->position
            ?? $this->academic_title
            ?? $this->department
            ?? 'Docente UPEL';
    }

    /**
     * Reseña profesional que se muestra en la landing.
     */
    public function landingBio(): string
    {
        if (filled($this->bio)) {
            return (string) $this->bio;
        }

        return $this->department !== null
            ? "Docente del departamento de {$this->department} de la UPEL."
            : 'Docente de la Universidad Pedagógica Experimental Libertador.';
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(
            Subject::class,
            'professor_subjects',
            'professor_id',
            'subject_id',
            'user_id',
            'id',
        )->withTimestamps();
    }
}
