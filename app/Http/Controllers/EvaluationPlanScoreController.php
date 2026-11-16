<?php

namespace App\Http\Controllers;

use App\Http\Requests\EvaluationPlanScoresRequest;
use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanScore;
use App\Models\StudentProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class EvaluationPlanScoreController extends Controller
{
    /**
     * Guarda las notas de la planilla y vacía las que quedaron en blanco.
     *
     * Si el docente califica a un estudiante del cohorte que todavía no tiene
     * inscripción en la materia, se le crea la inscripción con el cohorte
     * actual del plan.
     */
    public function update(
        EvaluationPlanScoresRequest $request,
        EvaluationPlan $plan,
    ): RedirectResponse {
        $plan->loadMissing(['items', 'subject']);

        $itemIds = $plan->items->pluck('id')->all();
        $careerId = $plan->subject?->career_id;

        DB::transaction(function () use ($careerId, $itemIds, $plan, $request): void {
            /** @var array<int, array<string, mixed>> $entries */
            $entries = $request->validated('scores', []);

            foreach ($entries as $entry) {
                $itemId = (int) $entry['item_id'];

                if (! in_array($itemId, $itemIds, true)) {
                    continue;
                }

                $score = $entry['score'] ?? null;
                $enrollment = $this->findEnrollment($plan, $entry);

                if ($enrollment === null) {
                    if ($score === null || $score === '') {
                        continue;
                    }

                    $enrollment = $this->createEnrollment($plan, $entry, $careerId);

                    if ($enrollment === null) {
                        continue;
                    }
                }

                if ($score === null || $score === '') {
                    EvaluationPlanScore::query()
                        ->where('evaluation_plan_item_id', $itemId)
                        ->where('enrollment_id', $enrollment->id)
                        ->delete();

                    continue;
                }

                EvaluationPlanScore::query()->updateOrCreate(
                    [
                        'evaluation_plan_item_id' => $itemId,
                        'enrollment_id' => $enrollment->id,
                    ],
                    ['score' => round((float) $score, 2)],
                );
            }
        });

        return back()->with('success', 'Las notas del plan de evaluación fueron guardadas.');
    }

    /**
     * Busca la inscripción existente del estudiante en la materia del plan.
     *
     * @param  array<string, mixed>  $entry
     */
    private function findEnrollment(EvaluationPlan $plan, array $entry): ?Enrollment
    {
        $enrollmentId = $entry['enrollment_id'] ?? null;
        $enrollment = null;

        if ($enrollmentId !== null) {
            $enrollment = Enrollment::query()->find((int) $enrollmentId);

            if (
                $enrollment !== null
                && $enrollment->subject_id === $plan->subject_id
                && $enrollment->academic_period_id === $plan->academic_period_id
            ) {
                return $enrollment;
            }
        }

        $studentId = $entry['student_id'] ?? $enrollment?->student_id;

        if ($studentId === null) {
            return null;
        }

        return Enrollment::query()
            ->where('student_id', (int) $studentId)
            ->where('subject_id', $plan->subject_id)
            ->where('academic_period_id', $plan->academic_period_id)
            ->first();
    }

    /**
     * Crea la inscripción de un estudiante activo de la carrera del plan.
     *
     * @param  array<string, mixed>  $entry
     */
    private function createEnrollment(EvaluationPlan $plan, array $entry, ?int $careerId): ?Enrollment
    {
        $studentId = $entry['student_id'] ?? null;

        if ($studentId === null) {
            return null;
        }

        $belongsToCareer = $careerId === null || StudentProfile::query()
            ->where('user_id', (int) $studentId)
            ->where('career_id', $careerId)
            ->where('status', 'activo')
            ->exists();

        if (! $belongsToCareer) {
            return null;
        }

        return Enrollment::query()->firstOrCreate(
            [
                'student_id' => (int) $studentId,
                'subject_id' => $plan->subject_id,
                'academic_period_id' => $plan->academic_period_id,
            ],
            [
                'professor_id' => $plan->professor_id,
                'status' => 'cursando',
            ],
        );
    }
}
