<?php

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users without a role cannot visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertForbidden();
});

test('students are redirected to the student dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index'),
        );
});

test('professors are redirected to the professor dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Profesor->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor'),
        );
});

test('graduates are redirected to the graduate dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Graduado->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/graduate'),
        );
});

test('administrative users are redirected to the admin dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect(route('admin.dashboard'));
});
