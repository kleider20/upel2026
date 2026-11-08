<?php

use App\Enums\Role;
use App\Models\ProfessorProfile;
use App\Models\User;
use Database\Seeders\AcademicSeeder;
use Database\Seeders\DemoProfessorSeeder;
use Database\Seeders\PensumSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

test('demo professors are created once and assigned to their education primary subjects', function () {
    $this->seed([
        RolePermissionSeeder::class,
        AcademicSeeder::class,
        PensumSeeder::class,
    ]);

    $this->seed(DemoProfessorSeeder::class);
    $this->seed(DemoProfessorSeeder::class);

    $expectedAssignments = [
        'Edilia Díaz' => 'Introducción al Estudio de la Lengua',
        'María De Abreu' => 'Educación Alimentaria y Nutrición',
        'Amada Prim' => 'Desarrollo de Procesos Cognitivos',
        'Benilde Figueroa' => 'Fundamentos de la Educación Primaria',
        'Leonardo Díaz' => 'Sociedad y Educación',
        'José Peñaloza' => 'Investigación I',
        'Christian Alviarez' => 'TIC I',
    ];

    expect(ProfessorProfile::query()->count())->toBe(7);

    foreach ($expectedAssignments as $name => $subjectName) {
        $user = User::query()->where('name', $name)->firstOrFail();
        $profile = $user->professorProfile()->with('subjects')->firstOrFail();

        expect($user->hasRole(Role::Profesor->value))->toBeTrue()
            ->and($user->must_change_password)->toBeTrue()
            ->and(Hash::check('DemoProfesor123!', $user->password))->toBeTrue()
            ->and($profile->subjects->pluck('name')->all())->toBe([$subjectName]);
    }
});
