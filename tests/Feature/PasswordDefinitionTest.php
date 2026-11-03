<?php

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Estudiante recién convertido: su contraseña inicial es la cédula.
 */
function studentWithInitialPassword(array $attributes = []): User
{
    $user = User::factory()->create(array_merge([
        'password' => '18534451',
        'must_change_password' => true,
    ], $attributes));

    $user->assignRole(Role::Estudiante->value);

    return $user;
}

test('el estudiante entra con su cédula y es enviado a definir la contraseña', function () {
    $user = studentWithInitialPassword();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => '18534451',
        'portal' => Role::Estudiante->value,
    ])->assertRedirect(route('password.define'));

    $this->assertAuthenticatedAs($user);
});

test('el portal queda bloqueado hasta definir la contraseña', function () {
    $user = studentWithInitialPassword();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('password.define'));

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertRedirect(route('password.define'));

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertRedirect(route('password.define'));
});

test('la página de definición muestra el correo registrado', function () {
    $user = studentWithInitialPassword();

    $this->actingAs($user)
        ->get(route('password.define'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/define-password')
            ->where('email', $user->email)
        );
});

test('el estudiante define su contraseña y entra al portal', function () {
    $user = studentWithInitialPassword();

    $this->actingAs($user)
        ->put(route('password.define.update'), [
            'password' => 'NuevaClave123!',
            'password_confirmation' => 'NuevaClave123!',
        ])
        ->assertRedirect(route('dashboard'));

    $user->refresh();

    expect(Hash::check('NuevaClave123!', $user->password))->toBeTrue()
        ->and($user->needsPasswordChange())->toBeFalse();

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk();
});

test('la nueva contraseña debe coincidir con la confirmación', function () {
    $user = studentWithInitialPassword();

    $this->actingAs($user)
        ->put(route('password.define.update'), [
            'password' => 'NuevaClave123!',
            'password_confirmation' => 'OtraClave123!',
        ])
        ->assertSessionHasErrors('password');

    expect($user->refresh()->needsPasswordChange())->toBeTrue();
});

test('un estudiante sin contraseña pendiente entra directo al portal', function () {
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk();
});
