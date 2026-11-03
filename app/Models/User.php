<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property bool $must_change_password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'must_change_password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * @return HasOne<StudentProfile, $this>
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * @return HasOne<ProfessorProfile, $this>
     */
    public function professorProfile(): HasOne
    {
        return $this->hasOne(ProfessorProfile::class);
    }

    /**
     * Solicitud de admisión que originó la cuenta del estudiante.
     *
     * @return HasOne<Admission, $this>
     */
    public function admission(): HasOne
    {
        return $this->hasOne(Admission::class, 'converted_user_id');
    }

    /**
     * Indica si el usuario debe definir una contraseña propia.
     */
    public function needsPasswordChange(): bool
    {
        return (bool) $this->must_change_password;
    }

    /**
     * Materias que imparte el profesor.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function taughtSubjects(): BelongsToMany
    {
        return $this->belongsToMany(
            Subject::class,
            'professor_subjects',
            'professor_id',
            'subject_id',
        )->withTimestamps();
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'student_id');
    }

    /**
     * Rol principal del usuario en el sistema.
     */
    public function portalRole(): ?Role
    {
        $role = $this->getRoleNames()->first();

        return $role !== null ? Role::tryFrom($role) : null;
    }

    /**
     * Indica si el usuario pertenece al portal administrativo.
     */
    public function isAdminPortalUser(): bool
    {
        return $this->hasAnyRole(Role::adminPortalValues());
    }

    /**
     * Indica si el usuario es estudiante.
     */
    public function isStudent(): bool
    {
        return $this->hasRole(Role::Estudiante->value);
    }

    /**
     * Indica si el usuario es profesor.
     */
    public function isProfessor(): bool
    {
        return $this->hasRole(Role::Profesor->value);
    }

    /**
     * Indica si el usuario es graduado.
     */
    public function isGraduate(): bool
    {
        return $this->hasRole(Role::Graduado->value);
    }
}
