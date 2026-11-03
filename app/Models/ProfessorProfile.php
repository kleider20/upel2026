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
 * @property string|null $department
 * @property string|null $academic_title
 */
#[Fillable(['user_id', 'employee_code', 'department', 'academic_title'])]
class ProfessorProfile extends Model
{
    /** @use HasFactory<ProfessorProfileFactory> */
    use HasFactory;

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
