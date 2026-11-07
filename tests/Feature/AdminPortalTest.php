<?php

use App\Enums\Role;
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
    'coordinador académico' => [Role::CoordinadorAcademico->value, 8, 4],
    'personal administrativo' => [Role::PersonalAdministrativo->value, 1, 1],
    'decano' => [Role::Decano->value, 9, 5],
    'administrador' => [Role::Admin->value, 11, 6],
]);

test('academic coordinators can access academic modules but not finance', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resource')
            ->where('module', 'students')
        );

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'finance']))
        ->assertForbidden();
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

test('deans can access academic and finance modules', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Decano->value);

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.module', ['module' => 'finance']))
        ->assertOk();
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
