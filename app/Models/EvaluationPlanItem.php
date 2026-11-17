<?php

namespace App\Models;

use Database\Factories\EvaluationPlanItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Evaluación concreta dentro de un plan de evaluación.
 *
 * @property int $id
 * @property int $evaluation_plan_id
 * @property int $position
 * @property string $title
 * @property string|null $content
 * @property int $weight
 * @property Carbon $scheduled_on
 */
#[Fillable([
    'evaluation_plan_id',
    'position',
    'title',
    'content',
    'weight',
    'scheduled_on',
])]
class EvaluationPlanItem extends Model
{
    /** @use HasFactory<EvaluationPlanItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'weight' => 'integer',
            'scheduled_on' => 'date',
        ];
    }

    /**
     * Indica si la fecha de la evaluación ya pasó.
     *
     * Una evaluación con la fecha cumplida queda cerrada: conserva sus notas
     * y ya no puede editarse desde la planilla del plan.
     */
    public function isPastDue(): bool
    {
        return $this->scheduled_on->lt(now()->startOfDay());
    }

    /**
     * @return BelongsTo<EvaluationPlan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(EvaluationPlan::class, 'evaluation_plan_id');
    }

    /**
     * Notas cargadas para esta evaluación.
     *
     * @return HasMany<EvaluationPlanScore, $this>
     */
    public function scores(): HasMany
    {
        return $this->hasMany(EvaluationPlanScore::class);
    }
}
