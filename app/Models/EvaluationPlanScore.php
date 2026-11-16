<?php

namespace App\Models;

use Database\Factories\EvaluationPlanScoreFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Nota de un estudiante en una evaluación del plan (escala de 1 a 20).
 *
 * @property int $id
 * @property int $evaluation_plan_item_id
 * @property int $enrollment_id
 * @property float $score
 */
#[Fillable(['evaluation_plan_item_id', 'enrollment_id', 'score'])]
class EvaluationPlanScore extends Model
{
    /** @use HasFactory<EvaluationPlanScoreFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'float',
        ];
    }

    /**
     * @return BelongsTo<EvaluationPlanItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(EvaluationPlanItem::class, 'evaluation_plan_item_id');
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }
}
