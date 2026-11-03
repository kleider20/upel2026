<?php

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('admin login screen can be rendered', function () {
    $response = $this->get(route('admin.login'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/login'),
        );
});

test('users can authenticate through their corresponding portal', function (string $role) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'portal' => $role,
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard', absolute: false));
})->with([
    Role::Estudiante->value,
    Role::Profesor->value,
    Role::Graduado->value,
]);

test('administrative users authenticate through the admin portal', function (string $role) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'portal' => Role::Admin->value,
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('admin.dashboard', absolute: false));
})->with(Role::adminPortalValues());

test('users cannot authenticate through a different portal', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'portal' => Role::Profesor->value,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'No existe ninguna cuenta de profesor registrada con este correo.',
    ]);
});

test('students cannot authenticate through the admin portal', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'portal' => Role::Admin->value,
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->withTwoFactor()->create();
    $user->assignRole(Role::Estudiante->value);

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
        'portal' => Role::Estudiante->value,
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
        'portal' => Role::Estudiante->value,
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('landing'));

    $this->assertGuest();
});

test('users are rate limited', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
        'portal' => Role::Estudiante->value,
    ]);

    $response->assertTooManyRequests();
});
