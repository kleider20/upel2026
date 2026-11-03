<?php

namespace App\Models;

use Database\Factories\EnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int $subject_id
 * @property int $academic_period_id
 * @property int|null $professor_id
 * @property string $status
 * @property float|null $final_grade
 * @property Carbon|null $grade_updated_at
 */
#[Fillable([
    'student_id',
    'subject_id',
    'academic_period_id',
    'professor_id',
    'status',
    'final_grade',
    'grade_updated_at',
])]
class Enrollment extends Model
{
    /** @use HasFactory<EnrollmentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'final_grade' => 'float',
            'grade_updated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * @return BelongsTo<AcademicPeriod, $this>
     */
    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    /**
     * Indica si la materia fue aprobada.
     */
    public function isApproved(): bool
    {
        return $this->status === 'aprobado';
    }

    /**
     * Etiqueta del estado de la inscripción.
     */
    public function statusLabel(): string
    {
        return match ($this->status) {
            'aprobado' => 'Aprobado',
            'reprobado' => 'Reprobado',
            'retirado' => 'Retirado',
            default => 'Cursando',
        };
    }

    /**
     * Tono visual del estado.
     */
    public function statusTone(): string
    {
        return match ($this->status) {
            'aprobado' => 'green',
            'reprobado' => 'red',
            'retirado' => 'slate',
            default => 'amber',
        };
    }
}
