<?php

use App\Enums\Role;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** Usuario con el rol del portal de graduados. */
function graduateUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::Graduado->value);

    return $user;
}

test('el récord académico del graduado es una página independiente', function () {
    $user = graduateUser();
    $enrollment = Enrollment::factory()
        ->for($user, 'student')
        ->graded(9.2)
        ->create();

    $this->actingAs($user)
        ->get(route('graduate.record'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('graduate/record/index')
            ->has('enrollments', 1)
            ->where('enrollments.0.id', $enrollment->id)
            ->where('enrollments.0.grade', 9.2)
            ->where('summary.subjects_count', 1)
        );
});

test('la oferta de postgrados del graduado es una página independiente', function () {
    $user = graduateUser();
    $program = Program::factory()->create([
        'name' => 'Especialización en Docencia Virtual',
        'type' => 'especializacion',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('graduate.programs'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('graduate/programs/index')
            ->has('programs', 1)
            ->where('programs.0.label', 'Especialización')
            ->where('programs.0.items.0.name', $program->name)
            ->where('summary.programs_count', 1)
        );
});

test('un estudiante no puede abrir las páginas del graduado', function (string $routeName) {
    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);

    $this->actingAs($student)
        ->get(route($routeName))
        ->assertForbidden();
})->with(['graduate.record', 'graduate.programs']);

test('un invitado es redirigido al inicio de sesión', function () {
    $this->get(route('graduate.record'))
        ->assertRedirect(route('login'));
});
