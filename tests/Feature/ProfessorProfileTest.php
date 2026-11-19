<?php

use App\Enums\Role;
use App\Models\ProfessorProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Perfil docente de demostración con su cuenta asociada.
 *
 * @return array{user: User, profile: ProfessorProfile}
 */
function professorProfileScenario(array $attributes = []): array
{
    $user = User::factory()->create([
        'name' => 'Dra. Carmen Rodríguez',
        'email' => 'carmen.rodriguez@upel.edu.ve',
    ]);
    $user->assignRole(Role::Profesor->value);

    $profile = ProfessorProfile::factory()->for($user)->create([
        'employee_code' => 'PROF-001',
        'identity_document' => 'V-12345678',
        'department' => 'Educación',
        'academic_title' => 'Doctora en Educación',
        ...$attributes,
    ]);

    return compact('user', 'profile');
}

test('el docente ve su perfil con los datos de su registro', function () {
    ['user' => $user] = professorProfileScenario();

    $this->actingAs($user)
        ->get(route('professor.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/profile')
            ->where('profile.name', 'Dra. Carmen Rodríguez')
            ->where('profile.email', 'carmen.rodriguez@upel.edu.ve')
            ->where('profile.employee_code', 'PROF-001')
            ->where('profile.identity_document', 'V-12345678')
            ->where('profile.department', 'Educación')
            ->where('profile.academic_title', 'Doctora en Educación')
            ->where('profile.position', null)
            ->where('profile.bio', null)
            ->where('profile.photo_url', null)
        );
});

test('el docente actualiza el cargo y la reseña que se publican en la landing', function () {
    ['user' => $user, 'profile' => $profile] = professorProfileScenario();

    $this->actingAs($user)
        ->put(route('professor.profile.update'), [
            'position' => 'Decana de Postgrado',
            'department' => 'Educación',
            'academic_title' => 'Doctora en Educación',
            'bio' => 'Doctora en Educación con 22 años de experiencia en formación avanzada y gestión académica.',
        ])
        ->assertRedirect(route('professor.profile.edit'))
        ->assertSessionHas('success');

    expect($profile->refresh())
        ->position->toBe('Decana de Postgrado')
        ->bio->toBe('Doctora en Educación con 22 años de experiencia en formación avanzada y gestión académica.')
        ->department->toBe('Educación');
});

test('el docente sube una fotografía tipo carnet que se usa como avatar', function () {
    Storage::fake('public');

    ['user' => $user, 'profile' => $profile] = professorProfileScenario();

    $this->actingAs($user)
        ->put(route('professor.profile.update'), [
            'position' => 'Decana de Postgrado',
            'photo' => UploadedFile::fake()->image('carnet.jpg', 400, 400),
        ])
        ->assertRedirect(route('professor.profile.edit'));

    $profile->refresh();

    expect($profile->photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($profile->photo_path);
    expect($profile->photoUrl())->toContain($profile->photo_path);
});

test('el docente quita su fotografía de perfil', function () {
    Storage::fake('public');

    ['user' => $user, 'profile' => $profile] = professorProfileScenario([
        'photo_path' => 'professors/anterior.jpg',
    ]);
    Storage::disk('public')->put('professors/anterior.jpg', 'contenido');

    $this->actingAs($user)
        ->put(route('professor.profile.update'), [
            'position' => 'Decana de Postgrado',
            'remove_photo' => true,
        ])
        ->assertRedirect(route('professor.profile.edit'));

    expect($profile->refresh()->photo_path)->toBeNull();
    Storage::disk('public')->assertMissing('professors/anterior.jpg');
});

test('la fotografía del perfil debe ser una imagen válida', function () {
    Storage::fake('public');

    ['user' => $user] = professorProfileScenario();

    $this->actingAs($user)
        ->put(route('professor.profile.update'), [
            'photo' => UploadedFile::fake()->create('documento.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasErrors('photo');
});

test('la reseña del perfil no puede superar los 800 caracteres', function () {
    ['user' => $user] = professorProfileScenario();

    $this->actingAs($user)
        ->put(route('professor.profile.update'), [
            'bio' => str_repeat('a', 801),
        ])
        ->assertSessionHasErrors('bio');
});

test('un estudiante no puede acceder al perfil docente', function () {
    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);

    $this->actingAs($student)
        ->get(route('professor.profile.edit'))
        ->assertForbidden();
});
