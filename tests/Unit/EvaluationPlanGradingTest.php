<?php

use App\Support\EvaluationPlanGrading;

test('accumulates the contribution of each graded evaluation', function () {
    expect(EvaluationPlanGrading::accumulatedTen([
        ['score' => 10.0, 'weight' => 15],
        ['score' => 12.0, 'weight' => 20],
    ]))->toBe(1.95);
});

test('does not normalize the definitive when weights are still missing', function () {
    expect(EvaluationPlanGrading::accumulatedTen([
        ['score' => 18.0, 'weight' => 20],
        ['score' => null, 'weight' => 20],
    ]))->toBe(1.8);
});

test('returns null when no evaluation has been graded', function () {
    expect(EvaluationPlanGrading::accumulatedTen([
        ['score' => null, 'weight' => 20],
        ['score' => null, 'weight' => 20],
    ]))->toBeNull();
});

test('computes the contribution of a score on the ten scale', function () {
    expect(EvaluationPlanGrading::contribution(10.0, 15))->toBe(0.75)
        ->and(EvaluationPlanGrading::contribution(12.0, 20))->toBe(1.2)
        ->and(EvaluationPlanGrading::contribution(20.0, 20))->toBe(2.0)
        ->and(EvaluationPlanGrading::contribution(null, 20))->toBeNull();
});

test('converts the score to the ten point scale', function () {
    expect(EvaluationPlanGrading::toScaleTen(20.0))->toBe(10.0)
        ->and(EvaluationPlanGrading::toScaleTen(12.0))->toBe(6.0)
        ->and(EvaluationPlanGrading::toScaleTen(11.0))->toBe(5.5)
        ->and(EvaluationPlanGrading::toScaleTen(null))->toBeNull();
});

test('passes the subject from six points on the ten point scale', function () {
    expect(EvaluationPlanGrading::isApproved(6.0, true))->toBeTrue()
        ->and(EvaluationPlanGrading::isApproved(5.99, true))->toBeFalse()
        ->and(EvaluationPlanGrading::isApproved(6.0, false))->toBeNull()
        ->and(EvaluationPlanGrading::isApproved(null, true))->toBeNull();
});

test('reports the weight still available in the plan', function () {
    expect(EvaluationPlanGrading::missingWeight(80))->toBe(20)
        ->and(EvaluationPlanGrading::missingWeight(100))->toBe(0)
        ->and(EvaluationPlanGrading::missingWeight(120))->toBe(0);
});
