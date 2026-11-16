<?php

use App\Support\EvaluationPlanGrading;

test('averages the graded evaluations by their weight', function () {
    expect(EvaluationPlanGrading::weightedScore([
        ['score' => 20.0, 'weight' => 20],
        ['score' => 12.0, 'weight' => 10],
    ]))->toBe(17.33);
});

test('ignores evaluations without a score so the definitive advances', function () {
    expect(EvaluationPlanGrading::weightedScore([
        ['score' => 18.0, 'weight' => 20],
        ['score' => null, 'weight' => 20],
    ]))->toBe(18.0);
});

test('returns null when no evaluation has been graded', function () {
    expect(EvaluationPlanGrading::weightedScore([
        ['score' => null, 'weight' => 20],
        ['score' => null, 'weight' => 20],
    ]))->toBeNull();
});

test('converts the score to the ten point scale', function () {
    expect(EvaluationPlanGrading::toScaleTen(20.0))->toBe(10.0)
        ->and(EvaluationPlanGrading::toScaleTen(12.0))->toBe(6.0)
        ->and(EvaluationPlanGrading::toScaleTen(11.0))->toBe(5.5)
        ->and(EvaluationPlanGrading::toScaleTen(null))->toBeNull();
});

test('passes the subject from six points on the ten point scale', function () {
    expect(EvaluationPlanGrading::isApproved(6.0))->toBeTrue()
        ->and(EvaluationPlanGrading::isApproved(5.99))->toBeFalse()
        ->and(EvaluationPlanGrading::isApproved(null))->toBeNull();
});

test('reports the weight still available in the plan', function () {
    expect(EvaluationPlanGrading::missingWeight(80))->toBe(20)
        ->and(EvaluationPlanGrading::missingWeight(100))->toBe(0)
        ->and(EvaluationPlanGrading::missingWeight(120))->toBe(0);
});
