<?php

use App\Enums\Role;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario administrativo con permisos sobre materias.
 */
function academicManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

test('guests are redirected to the admin login page', function () {
    $this->get(route('admin.subjects.index'))
        ->assertRedirect(route('admin.login'));
});

test('financial staff cannot access subject management', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.subjects.index'))
        ->assertForbidden();
});

test('academic managers can list subjects with filters and stats', function () {
    $career = Career::factory()->create();
    Subject::factory()->for($career)->create([
        'name' => 'Didáctica General',
        'code' => 'CAR-001',
        'semester' => 3,
        'modality' => 'online',
    ]);
    Subject::factory()->create(['name' => 'Otra materia', 'modality' => 'presencial']);
    // Cada materia de prueba vive en su propia carrera, así que el filtro
    // ofrece las dos carreras disponibles.
    $careers = Career::query()->count();

    $this->actingAs(academicManager())
        ->get(route('admin.subjects.index', ['search' => 'Didáctica']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/subjects/index')
            ->has('subjects.data', 1)
            ->where('subjects.data.0.name', 'Didáctica General')
            ->where('subjects.data.0.semester', 3)
            ->where('subjects.data.0.modality', 'online')
            ->where('filters.search', 'Didáctica')
            ->has('careers', $careers)
            ->has('modalities', 3)
            ->has('stats', 4)
            ->where('can_manage', true)
        );

    $this->actingAs(academicManager())
        ->get(route('admin.subjects.index', ['modality' => 'presencial']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/subjects/index')
            ->has('subjects.data', 1)
            ->where('subjects.data.0.name', 'Otra materia')
            ->where('filters.modality', 'presencial')
        );
});

test('academic managers can create a subject', function () {
    $career = Career::factory()->create();

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => 'car-010',
            'name' => 'Evaluación del Aprendizaje',
            'semester' => 5,
            'modality' => 'online',
            'component' => 'CFD',
            'type' => 'UNCO',
            'area' => null,
            'level' => 'INTEG',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 8,
            'prerequisites' => 'Didáctica General',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    $subject = Subject::query()->where('name', 'Evaluación del Aprendizaje')->first();

    expect($subject)->not->toBeNull()
        ->and($subject->career_id)->toBe($career->id)
        ->and($subject->code)->toBe('CAR-010')
        ->and($subject->semester)->toBe(5)
        ->and($subject->modality)->toBe('online')
        ->and($subject->is_active)->toBeTrue();
});

test('academic managers can create a subject without code and it is generated', function () {
    $career = Career::factory()->create();

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => '',
            'name' => 'Aprendizaje Matemático 1',
            'semester' => 2,
            'modality' => 'online',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 8,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    expect(Subject::query()->where('name', 'Aprendizaje Matemático 1')->first()?->code)
        ->toBe('AMI-PA2ONLINE');
});

test('elective subjects get the UNCLE suffix when the code is generated', function () {
    $career = Career::factory()->create();

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => '',
            'name' => 'Desarrollo Socio Afectivo y Sexualidad',
            'semester' => 2,
            'modality' => 'online',
            'component' => 'CFPE',
            'type' => 'UNCLE',
            'credits' => 2,
            'theory_hours' => 2,
            'practice_hours' => 4,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    $subject = Subject::query()
        ->where('name', 'Desarrollo Socio Afectivo y Sexualidad')
        ->first();

    expect($subject?->code)->toBe('DSAS-PA2ONLINEUNCLE')
        ->and($subject?->type)->toBe('UNCLE');
});

test('mixed-case subject codes are preserved', function () {
    $career = Career::factory()->create();

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => 'ApreMateI-PA1PRE',
            'name' => 'Aprendizaje Matemático 1',
            'semester' => 1,
            'modality' => 'presencial',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 8,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    expect(Subject::query()->where('name', 'Aprendizaje Matemático 1')->first()?->code)
        ->toBe('ApreMateI-PA1PRE');
});

test('subject codes must be unique within a career', function () {
    $career = Career::factory()->create();
    Subject::factory()->for($career)->create(['code' => 'CAR-001']);

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => 'CAR-001',
            'name' => 'Materia duplicada',
            'semester' => 1,
            'modality' => 'presencial',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 0,
        ])
        ->assertSessionHasErrors('code');

    expect(Subject::query()->where('name', 'Materia duplicada')->exists())->toBeFalse();
});

test('the create form lists subjects that can be used as prerequisites', function () {
    $career = Career::factory()->create();
    Subject::factory()->for($career)->create([
        'name' => 'Didáctica General',
        'code' => 'CAR-001',
        'semester' => 1,
    ]);

    $this->actingAs(academicManager())
        ->get(route('admin.subjects.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/subjects/form')
            ->has('subjects', 1)
            ->where('subjects.0.name', 'Didáctica General')
            ->where('subjects.0.semester', 1)
            ->where('subjects.0.career_id', $career->id)
        );
});

test('first semester subjects ignore prerequisites', function () {
    $career = Career::factory()->create();

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => 'CAR-020',
            'name' => 'Introducción a la Pedagogía',
            'semester' => 1,
            'modality' => 'presencial',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 8,
            'prerequisites' => 'Materia inexistente',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    expect(Subject::query()->where('name', 'Introducción a la Pedagogía')->first()?->prerequisites)
        ->toBeNull();
});

test('subjects from the second semester keep their prerequisite', function () {
    $career = Career::factory()->create();
    Subject::factory()->for($career)->create([
        'name' => 'Introducción a la Pedagogía',
        'semester' => 1,
    ]);

    $this->actingAs(academicManager())
        ->post(route('admin.subjects.store'), [
            'career_id' => $career->id,
            'code' => 'CAR-021',
            'name' => 'Didáctica General',
            'semester' => 2,
            'modality' => 'presencial',
            'credits' => 4,
            'theory_hours' => 4,
            'practice_hours' => 8,
            'prerequisites' => 'Introducción a la Pedagogía',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    expect(Subject::query()->where('name', 'Didáctica General')->first()?->prerequisites)
        ->toBe('Introducción a la Pedagogía');
});

test('academic managers can update a subject', function () {
    $subject = Subject::factory()->create([
        'name' => 'Nombre anterior',
        'semester' => 2,
    ]);

    $this->actingAs(academicManager())
        ->put(route('admin.subjects.update', $subject), [
            'career_id' => $subject->career_id,
            'code' => $subject->code,
            'name' => 'Nombre actualizado',
            'semester' => 6,
            'modality' => 'mixta',
            'component' => 'CFPE',
            'type' => 'UNCO',
            'credits' => 3,
            'theory_hours' => 2,
            'practice_hours' => 4,
            'prerequisites' => null,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.subjects.index'));

    $subject->refresh();

    expect($subject->name)->toBe('Nombre actualizado')
        ->and($subject->semester)->toBe(6)
        ->and($subject->modality)->toBe('mixta')
        ->and($subject->credits)->toBe(3)
        ->and($subject->is_active)->toBeFalse();
});

test('academic managers can delete a subject without enrollments', function () {
    $subject = Subject::factory()->create();

    $this->actingAs(academicManager())
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertRedirect(route('admin.subjects.index'));

    expect(Subject::query()->find($subject->id))->toBeNull();
});

test('subjects with enrollments cannot be deleted', function () {
    $subject = Subject::factory()->create();
    Enrollment::factory()->for($subject)->create();

    $this->actingAs(academicManager())
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Subject::query()->find($subject->id))->not->toBeNull();
});
