<?php

namespace App\Http\Controllers;

use App\Http\Requests\EvaluationPlanItemRequest;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class EvaluationPlanItemController extends Controller
{
    /**
     * Agrega una evaluación al final del plan.
     */
    public function store(
        EvaluationPlanItemRequest $request,
        EvaluationPlan $plan,
    ): RedirectResponse {
        $position = (int) $plan->items()->max('position') + 1;

        $plan->items()->create([
            'position' => $position,
            ...$request->validated(),
        ]);

        $plan->syncScheduleWindow();

        return back()->with('success', 'La evaluación fue agregada al plan.');
    }

    /**
     * Actualiza la fecha, el porcentaje o el contenido de una evaluación.
     */
    public function update(
        EvaluationPlanItemRequest $request,
        EvaluationPlan $plan,
        EvaluationPlanItem $item,
    ): RedirectResponse {
        abort_unless($item->evaluation_plan_id === $plan->id, 404);

        $item->update($request->validated());

        $plan->syncScheduleWindow();

        return back()->with('success', 'La evaluación fue actualizada.');
    }

    /**
     * Elimina la evaluación y reordena las restantes.
     */
    public function destroy(
        EvaluationPlanItemRequest $request,
        EvaluationPlan $plan,
        EvaluationPlanItem $item,
    ): RedirectResponse {
        abort_unless($item->evaluation_plan_id === $plan->id, 404);

        DB::transaction(function () use ($plan, $item): void {
            $item->scores()->delete();
            $item->delete();

            $plan->items()
                ->get()
                ->values()
                ->each(function (EvaluationPlanItem $current, int $index): void {
                    $position = $index + 1;

                    if ($current->position !== $position) {
                        $current->update(['position' => $position]);
                    }
                });

            $plan->syncScheduleWindow();
        });

        return back()->with('success', 'La evaluación fue eliminada del plan.');
    }
}
