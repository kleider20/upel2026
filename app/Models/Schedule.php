<?php

namespace App\Models;

use App\Support\StudentSchedule;
use Database\Factories\ScheduleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $career_id
 * @property int $period
 * @property string $cohort
 * @property Carbon|null $starts_on
 * @property Carbon|null $ends_on
 * @property string|null $study_schedule
 * @property string|null $modality
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Career $career
 * @property-read Collection<int, Subject> $subjects
 */
#[Fillable(['career_id', 'period', 'cohort', 'starts_on', 'ends_on', 'study_schedule', 'modality'])]
class Schedule extends Model
{
    /** @use HasFactory<ScheduleFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period' => 'integer',
            'starts_on' => 'date',
            'ends_on' => 'date',
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
     * Materias seleccionadas para cada franja del horario.
     *
     * La posición define qué patrón de horas de la plantilla oficial usa la
     * materia y en qué fila del horario se muestra.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'schedule_subjects')
            ->withPivot('position', 'professor_id', 'teacher_name', 'dates', 'starts_at', 'ends_at')
            ->withTimestamps()
            ->orderBy('schedule_subjects.position');
    }

    /**
     * Etiqueta romana del período académico.
     */
    public function periodLabel(): string
    {
        return StudentSchedule::roman($this->period);
    }

    /**
     * Construye el horario completo con el formato oficial.
     *
     * @return array<string, mixed>
     */
    public function toScheduleArray(?string $studySchedule = null): array
    {
        $this->loadMissing(['career', 'subjects.professors']);

        $subjects = $this->subjects
            ->map(static function (Subject $subject): array {
                $chosenProfessorId = $subject->pivot->professor_id;
                $chosenProfessor = $chosenProfessorId !== null
                    ? $subject->professors->firstWhere('id', (int) $chosenProfessorId)
                    : null;
                $chosenTeacherName = trim((string) ($subject->pivot->teacher_name ?? ''));
                $dates = $subject->pivot->dates;

                if (is_string($dates)) {
                    $dates = json_decode($dates, true);
                }

                return [
                    'position' => (int) $subject->pivot->position,
                    'code' => $subject->code,
                    'name' => $subject->name,
                    'teacher' => $chosenProfessor?->name
                        ?? ($chosenTeacherName !== '' ? $chosenTeacherName : null)
                        ?? $subject->professors->first()?->name,
                    'modality' => $subject->modality,
                    'dates' => is_array($dates) ? array_values($dates) : [],
                    'starts_at' => $subject->pivot->starts_at,
                    'ends_at' => $subject->pivot->ends_at,
                ];
            })
            ->all();

        return StudentSchedule::build(
            (string) $this->career->name,
            $this->period,
            $this->cohort,
            $this->study_schedule ?? $studySchedule,
            $subjects === [] ? null : $subjects,
            $this->starts_on?->toDateString(),
            $this->ends_on?->toDateString(),
        );
    }
}
