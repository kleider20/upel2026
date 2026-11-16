<?php

use App\Models\Career;
use App\Models\Subject;
use Database\Seeders\PensumSeeder;

test('el pensum oficial de Educación Primaria suma 205 créditos', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
    ]);

    $this->seed(PensumSeeder::class);

    $base = Subject::query()
        ->where('career_id', $career->id)
        ->pensumBase()
        ->get();

    expect($base)->toHaveCount(53)
        ->and($base->sum('credits'))->toBe(205)
        ->and($base->where('is_elective_slot', true))->toHaveCount(14);

    $periodCredits = $base
        ->groupBy('semester')
        ->map->sum('credits')
        ->sortKeys()
        ->values()
        ->all();

    expect($periodCredits)->toBe([26, 26, 26, 26, 26, 26, 26, 23]);

    $this->seed(PensumSeeder::class);

    expect(
        Subject::query()
            ->where('career_id', $career->id)
            ->pensumBase()
            ->count(),
    )->toBe(53);
});
