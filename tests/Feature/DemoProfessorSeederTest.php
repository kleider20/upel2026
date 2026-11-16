<?php

use App\Enums\Role;
use App\Models\ProfessorProfile;
use App\Models\User;
use Database\Seeders\AcademicSeeder;
use Database\Seeders\DemoProfessorSeeder;
use Database\Seeders\PensumSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed([
        RolePermissionSeeder::class,
        AcademicSeeder::class,
        PensumSeeder::class,
        DemoProfessorSeeder::class,
    ]);
});

/**
 * Correos, nombres y materia de los docentes de demostración.
 *
 * @return array<string, array{0: string, 1: string}>
 */
function demoProfessorAssignments(): array
{
    return [
        'edilia.diaz.demo@upel.test' => ['Edilia Díaz', 'Introducción al Estudio de la Lengua'],
        'maria.deabreu.demo@upel.test' => ['María De Abreu', 'Educación Alimentaria y Nutrición'],
        'amada.prim.demo@upel.test' => ['Amada Prim', 'Desarrollo de Procesos Cognitivos'],
        'benilde.figueroa.demo@upel.test' => ['Benilde Figueroa', 'Fundamentos de la Educación Primaria'],
        'leonardo.diaz.demo@upel.test' => ['Leonardo Díaz', 'Sociedad y Educación'],
        'jose.penaloza.demo@upel.test' => ['José Peñaloza', 'Investigación I'],
        'christian.alviarez.demo@upel.test' => ['Christian Alviarez', 'TIC I'],
    ];
}

test('los docentes de demostración se crean con su materia y la contraseña test123', function () {
    expect(ProfessorProfile::query()->count())->toBe(7);

    foreach (demoProfessorAssignments() as $email => [$name, $subjectName]) {
        $user = User::query()->where('email', $email)->sole();
        $profile = $user->professorProfile()->with('subjects')->firstOrFail();

        expect($user->name)->toBe($name)
            ->and($user->hasRole(Role::Profesor->value))->toBeTrue()
            ->and($user->must_change_password)->toBeTrue()
            ->and(Hash::check('test123', $user->password))->toBeTrue()
            ->and($profile->subjects->pluck('name')->all())->toBe([$subjectName]);
    }
});

test('el primer inicio de sesión del docente lleva a definir la contraseña', function () {
    $this->post(route('login.store'), [
        'email' => 'edilia.diaz.demo@upel.test',
        'password' => 'test123',
        'portal' => Role::Profesor->value,
    ])->assertRedirect(route('password.define'));

    $this->assertAuthenticated();
});

test('el portal del docente queda bloqueado hasta definir la contraseña', function () {
    $professor = User::query()->where('email', 'edilia.diaz.demo@upel.test')->sole();

    $this->actingAs($professor)
        ->get(route('dashboard'))
        ->assertRedirect(route('password.define'));
});

test('volver a sembrar los docentes no duplica usuarios y restablece la clave inicial', function () {
    $professor = User::query()->where('email', 'edilia.diaz.demo@upel.test')->sole();
    $professor->update([
        'password' => 'OtraClave123!',
        'must_change_password' => false,
    ]);

    $this->seed(DemoProfessorSeeder::class);

    expect(User::query()->whereIn('email', array_keys(demoProfessorAssignments()))->count())->toBe(7)
        ->and(ProfessorProfile::query()->count())->toBe(7)
        ->and($professor->refresh()->needsPasswordChange())->toBeTrue()
        ->and(Hash::check(DemoProfessorSeeder::DEMO_PASSWORD, $professor->password))->toBeTrue();
});
