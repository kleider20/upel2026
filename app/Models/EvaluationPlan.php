<?php

namespace App\Models;

use App\Support\AcademicOptions;
use App\Support\EvaluationPlanGrading;
use Database\Factories\EvaluationPlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Plan de evaluación de una materia para una carrera y cohorte concretas.
 *
 * @property int $id
 * @property int $professor_id
 * @property int $schedule_id
 * @property int $subject_id
 * @property int $academic_period_id
 * @property string $modality
 * @property Carbon|null $starts_on
 * @property Carbon|null $ends_on
 * @property-read User $professor
 * @property-read Schedule $schedule
 * @property-read Subject $subject
 * @property-read AcademicPeriod $academicPeriod
 */
#[Fillable([
    'professor_id',
    'schedule_id',
    'subject_id',
    'academic_period_id',
    'modality',
    'starts_on',
    'ends_on',
])]
class EvaluationPlan extends Model
{
    /** @use HasFactory<EvaluationPlanFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    /**
     * Horario publicado que define carrera, período y cohorte.
     *
     * @return BelongsTo<Schedule, $this>
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
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
     * Evaluaciones que componen el plan, en su orden de presentación.
     *
     * @return HasMany<EvaluationPlanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(EvaluationPlanItem::class)->orderBy('position');
    }

    /**
     * Código y nombre de la materia en el formato de la planilla.
     */
    public function courseLabel(): string
    {
        return trim(sprintf('%s - %s', $this->subject->code, $this->subject->name));
    }

    /**
     * Porcentaje acumulado del plan.
     */
    public function totalWeight(): int
    {
        return (int) $this->items->sum('weight');
    }

    /**
     * Porcentaje que falta por asignar.
     */
    public function remainingWeight(): int
    {
        return EvaluationPlanGrading::missingWeight($this->totalWeight());
    }

    /**
     * Indica si la ponderación del plan está completa.
     */
    public function isComplete(): bool
    {
        return $this->totalWeight() === EvaluationPlanGrading::TOTAL_WEIGHT;
    }

    /**
     * Etiqueta del ambiente de aprendizaje.
     */
    public function modalityLabel(): string
    {
        return AcademicOptions::modalityLabel($this->modality);
    }

    /**
     * Actualiza la fecha de inicio y fin del plan según sus evaluaciones.
     */
    public function syncScheduleWindow(): void
    {
        $items = $this->items()->get(['scheduled_on']);

        $this->forceFill([
            'starts_on' => $items->min('scheduled_on'),
            'ends_on' => $items->max('scheduled_on'),
        ])->save();
    }
}
