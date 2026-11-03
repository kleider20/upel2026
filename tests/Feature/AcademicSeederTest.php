<?php

use App\Models\Career;
use Database\Seeders\AcademicSeeder;

test('only the four official careers remain after seeding', function () {
    Career::factory()->create(['code' => 'ADMEDU', 'name' => 'Administración Educacional']);

    $this->seed(AcademicSeeder::class);

    expect(Career::query()->orderBy('code')->pluck('code')->all())
        ->toBe(['EDESP', 'EDPRI', 'GEHIS', 'LENLI']);
});

test('historical career codes are renamed instead of duplicated', function () {
    $career = Career::factory()->create([
        'code' => 'GEOHIS',
        'name' => 'Geografía e Historia',
    ]);

    $this->seed(AcademicSeeder::class);

    expect(Career::query()->where('code', 'GEHIS')->value('id'))->toBe($career->id)
        ->and(Career::query()->where('code', 'GEOHIS')->exists())->toBeFalse();
});
