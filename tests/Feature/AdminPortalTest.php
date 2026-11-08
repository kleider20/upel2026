<?php

use App\Enums\Role;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected to the admin login page', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'));

    $this->get(route('admin.entry'))
        ->assertRedirect(route('admin.login'));
});

test('non administrative users cannot access the admin portal', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('dashboard'));
});

test('administrative users can access the admin dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    $this->actingAs($user)
        ->get(route('admin.entry'))
        ->assertRedirect(route('admin.dashboard'));

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('role_key', Role::Admin->value)
        );
});

test('admin dashboard modules are scoped by role', function (string $role, int $modules, int $summary) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('role_key', $role)
            ->has('modules', $modules)
            ->has('summary', $summary)
        );
})->with([
    'coordinador académico' => [Role::CoordinadorAcademico->value, 6, 3],
    'personal administrativo' => [Role::PersonalAdministrativo->value, 1, 1],
    'decano' => [Role::Decano->value, 10, 5],
    'administrador' => [Role::Admin->value, 11, 6],
]);

test('academic coordinators can access modules granted by permissions', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'careers']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/careers/index')
        );

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'finance']))
        ->assertForbidden();

    $user->givePermissionTo('students.view');

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk();
});

test('administrative staff can access finance but not academic modules', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'finance']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertForbidden();
});

test('dashboard exposes student and admission modules granted through direct permissions', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);
    $user->givePermissionTo(['students.view', 'admissions.view']);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('modules', 8)
            ->has('summary', 4)
        );

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.admissions.index'))
        ->assertOk();
});

test('deans can access academic finance and student modules', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Decano->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'finance']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk();
});

test('administrators can access student lists and profiles', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);
    $student = User::factory()->create();
    $profile = StudentProfile::factory()->for($student)->create();

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('module', 'students'));

    $this->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/students/show')
            ->where('student.name', $student->name)
        );
});

test('administrators can access system modules', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'users']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'roles']))
        ->assertOk();
});
