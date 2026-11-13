<?php

use App\Enums\Role;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario administrativo con permisos sobre carreras.
 */
function careerManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

/**
 * @return array<int, array{modality: string, schedule: string, shift: string, is_active: bool}>
 */
function offeringsPayload(): array
{
    return [
        [
            'modality' => 'presencial',
            'schedule' => 'lunes_viernes',
            'shift' => 'diurno',
            'is_active' => true,
        ],
        [
            'modality' => 'online',
            'schedule' => 'sabatino',
            'shift' => 'diurno',
            'is_active' => true,
        ],
    ];
}

test('guests are redirected to the admin login page', function () {
    $this->get(route('admin.careers.index'))
        ->assertRedirect(route('admin.login'));
});

test('financial staff cannot access career management', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.careers.index'))
        ->assertForbidden();
});

test('academic managers can list careers with offerings and filters', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'modality' => 'mixta',
    ]);

    CareerOffering::factory()->for($career)->create([
        'modality' => 'mixta',
        'schedule' => 'sabatino',
        'shift' => 'diurno',
    ]);
    CareerOffering::factory()->for($career)->create([
        'modality' => 'online',
        'schedule' => 'lunes_viernes',
        'shift' => 'nocturno',
    ]);

    $otherCareer = Career::factory()->create([
        'name' => 'Educación Especial',
        'code' => 'EDESP',
    ]);

    CareerOffering::factory()->for($otherCareer)->create([
        'modality' => 'presencial',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
    ]);

    $this->actingAs(careerManager())
        ->get(route('admin.careers.index', ['search' => 'Primaria']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/careers/index')
            ->has('careers.data', 1)
            ->where('careers.data.0.name', 'Educación Primaria')
            ->has('careers.data.0.offerings', 2)
            ->where('careers.data.0.offerings.0.modality', 'online')
            ->where('careers.data.0.offerings.0.modality_label', 'Online')
            ->where('careers.data.0.offerings.1.schedule_label', 'Sabatino')
            ->where('filters.search', 'Primaria')
            ->has('modalities', 3)
            ->has('schedules', 2)
            ->has('stats', 4)
            ->where('can_manage', true)
        );

    $this->actingAs(careerManager())
        ->get(route('admin.careers.index', ['modality' => 'online']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/careers/index')
            ->has('careers.data', 1)
            ->where('careers.data.0.code', 'EDPRI')
            ->where('filters.modality', 'online')
        );

    $this->actingAs(careerManager())
        ->get(route('admin.careers.index', ['schedule' => 'sabatino']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/careers/index')
            ->has('careers.data', 1)
            ->where('careers.data.0.code', 'EDPRI')
            ->where('filters.schedule', 'sabatino')
        );
});

test('academic managers can create a career with several offerings', function () {
    $this->actingAs(careerManager())
        ->post(route('admin.careers.store'), [
            'name' => 'Educación Integral',
            'code' => 'edint',
            'description' => 'Formación integral para la etapa primaria.',
            'duration_semesters' => 10,
            'is_active' => true,
            'offerings' => offeringsPayload(),
        ])
        ->assertRedirect(route('admin.careers.index'));

    $career = Career::query()->where('code', 'EDINT')->first();

    expect($career)->not->toBeNull()
        ->and($career->name)->toBe('Educación Integral')
        ->and($career->duration_semesters)->toBe(10)
        ->and($career->degree)->toBe('Licenciatura')
        ->and($career->modality)->toBe('mixta')
        ->and($career->offerings)->toHaveCount(2);
});

test('academic managers can create a career with landing details and an image', function () {
    Storage::fake('public');

    $this->actingAs(careerManager())
        ->post(route('admin.careers.store'), [
            'name' => 'Educación Primaria',
            'code' => 'EDPRI',
            'description' => 'Formación para acompañar el desarrollo integral de niños y niñas en la etapa primaria.',
            'degree' => 'Licenciatura en Educación',
            'icon' => '📚',
            'image' => UploadedFile::fake()->image('primaria.jpg'),
            'duration_semesters' => 8,
            'is_active' => true,
            'offerings' => offeringsPayload(),
        ])
        ->assertRedirect(route('admin.careers.index'));

    $career = Career::query()->where('code', 'EDPRI')->firstOrFail();

    expect($career->degree)->toBe('Licenciatura en Educación')
        ->and($career->icon)->toBe('📚')
        ->and($career->image_path)->not->toBeNull();

    Storage::disk('public')->assertExists($career->image_path);
});

test('academic managers can replace and remove a career image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('careers/old.jpg', 'old-image');

    $career = Career::factory()->create([
        'image_path' => 'careers/old.jpg',
    ]);

    $this->actingAs(careerManager())
        ->put(route('admin.careers.update', $career), [
            'name' => $career->name,
            'code' => $career->code,
            'description' => null,
            'degree' => 'Licenciatura',
            'duration_semesters' => 8,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('nueva.png'),
            'offerings' => offeringsPayload(),
        ])
        ->assertRedirect(route('admin.careers.index'));

    $career->refresh();
    $newImagePath = $career->image_path;

    expect($newImagePath)->not->toBe('careers/old.jpg');
    Storage::disk('public')->assertMissing('careers/old.jpg');
    Storage::disk('public')->assertExists($newImagePath);

    $this->actingAs(careerManager())
        ->put(route('admin.careers.update', $career), [
            'name' => $career->name,
            'code' => $career->code,
            'description' => null,
            'degree' => 'Licenciatura',
            'duration_semesters' => 8,
            'is_active' => true,
            'remove_image' => true,
            'offerings' => offeringsPayload(),
        ])
        ->assertRedirect(route('admin.careers.index'));

    expect($career->fresh()->image_path)->toBeNull();
    Storage::disk('public')->assertMissing($newImagePath);
});

test('duplicate offering combinations are rejected', function () {
    $offerings = offeringsPayload();

    $this->actingAs(careerManager())
        ->post(route('admin.careers.store'), [
            'name' => 'Carrera duplicada',
            'code' => 'DUP',
            'duration_semesters' => 8,
            'is_active' => true,
            'offerings' => [$offerings[0], $offerings[0]],
        ])
        ->assertSessionHasErrors('offerings.1.modality');

    expect(Career::query()->where('code', 'DUP')->exists())->toBeFalse();
});

test('academic managers can update a career and replace its offerings', function () {
    $career = Career::factory()->create([
        'name' => 'Nombre anterior',
        'modality' => 'presencial',
    ]);

    CareerOffering::factory()->for($career)->create([
        'modality' => 'presencial',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
    ]);

    $this->actingAs(careerManager())
        ->put(route('admin.careers.update', $career), [
            'name' => 'Nombre actualizado',
            'code' => $career->code,
            'description' => null,
            'duration_semesters' => 9,
            'is_active' => false,
            'offerings' => [
                [
                    'modality' => 'online',
                    'schedule' => 'sabatino',
                    'shift' => 'nocturno',
                    'is_active' => true,
                ],
            ],
        ])
        ->assertRedirect(route('admin.careers.index'));

    $career->refresh();

    expect($career->name)->toBe('Nombre actualizado')
        ->and($career->duration_semesters)->toBe(9)
        ->and($career->modality)->toBe('online')
        ->and($career->is_active)->toBeFalse()
        ->and($career->offerings)->toHaveCount(1)
        ->and($career->offerings->first()->schedule)->toBe('sabatino')
        ->and($career->offerings->first()->shift)->toBe('nocturno');
});

test('academic managers can delete a career without subjects or students', function () {
    $career = Career::factory()->create();
    CareerOffering::factory()->for($career)->create();

    $this->actingAs(careerManager())
        ->delete(route('admin.careers.destroy', $career))
        ->assertRedirect(route('admin.careers.index'));

    expect(Career::query()->find($career->id))->toBeNull()
        ->and(CareerOffering::query()->where('career_id', $career->id)->exists())->toBeFalse();
});

test('careers with subjects cannot be deleted', function () {
    $career = Career::factory()->create();
    Subject::factory()->for($career)->create();

    $this->actingAs(careerManager())
        ->delete(route('admin.careers.destroy', $career))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Career::query()->find($career->id))->not->toBeNull();
});

test('careers with students cannot be deleted', function () {
    $career = Career::factory()->create();
    StudentProfile::factory()->for($career)->create();

    $this->actingAs(careerManager())
        ->delete(route('admin.careers.destroy', $career))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Career::query()->find($career->id))->not->toBeNull();
});
