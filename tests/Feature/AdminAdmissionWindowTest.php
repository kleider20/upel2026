<?php

use App\Enums\Role;
use App\Models\AdmissionWindowSetting;
use App\Models\User;
use App\Support\AdmissionWindow;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Crea la ventana con el rango y el modo indicados.
 */
function admissionWindow(array $attributes = []): AdmissionWindowSetting
{
    return AdmissionWindowSetting::query()->create([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-11-30',
        'mode' => AdmissionWindowSetting::MODE_AUTOMATIC,
        ...$attributes,
    ]);
}

test('el administrador actualiza las fechas y el estado de las inscripciones', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    $this->actingAs($admin)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-11-20',
            'closes_on' => '2026-12-15',
            'mode' => AdmissionWindowSetting::MODE_CLOSED,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $settings = AdmissionWindowSetting::current();

    expect($settings->opens_on->toDateString())->toBe('2026-11-20')
        ->and($settings->closes_on->toDateString())->toBe('2026-12-15')
        ->and($settings->mode)->toBe(AdmissionWindowSetting::MODE_CLOSED);
});

test('el decano puede habilitar y deshabilitar las inscripciones', function () {
    $dean = User::factory()->create();
    $dean->assignRole(Role::Decano->value);

    $this->actingAs($dean)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-11-01',
            'closes_on' => '2026-11-30',
            'mode' => AdmissionWindowSetting::MODE_OPEN,
        ])
        ->assertRedirect();

    expect(AdmissionWindowSetting::current()->mode)
        ->toBe(AdmissionWindowSetting::MODE_OPEN);
});

test('los coordinadores académicos no pueden cambiar la ventana de inscripciones', function () {
    $coordinator = User::factory()->create();
    $coordinator->assignRole(Role::CoordinadorAcademico->value);

    $this->actingAs($coordinator)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-11-01',
            'closes_on' => '2026-11-30',
            'mode' => AdmissionWindowSetting::MODE_OPEN,
        ])
        ->assertForbidden();
});

test('la fecha de cierre debe ser posterior a la fecha de inicio', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    $this->actingAs($admin)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-12-15',
            'closes_on' => '2026-11-20',
            'mode' => AdmissionWindowSetting::MODE_AUTOMATIC,
        ])
        ->assertSessionHasErrors('closes_on');

    $this->actingAs($admin)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-11-01',
            'closes_on' => '2026-11-30',
            'mode' => 'inventado',
        ])
        ->assertSessionHasErrors('mode');
});

test('el panel administrativo muestra la ventana con permiso de gestión', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);
    admissionWindow([
        'opens_on' => '2026-11-20',
        'closes_on' => '2026-12-15',
        'mode' => AdmissionWindowSetting::MODE_CLOSED,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('admission_window.can_manage', true)
            ->where('admission_window.opens_on', '2026-11-20')
            ->where('admission_window.closes_on', '2026-12-15')
            ->where('admission_window.mode', AdmissionWindowSetting::MODE_CLOSED)
            ->where('admission_window.is_open', false)
            ->where('admission_window.status_label', 'Inscripciones cerradas')
        );
});

test('el resto de los roles ve la ventana sin permiso de gestión', function () {
    $coordinator = User::factory()->create();
    $coordinator->assignRole(Role::CoordinadorAcademico->value);
    admissionWindow();
    $this->travelTo(Carbon::parse('2026-11-15T12:00:00-04:00'));

    $this->actingAs($coordinator)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('admission_window.can_manage', false)
            ->where('admission_window.is_open', true)
        );
});

test('en modo automático la ventana solo abre dentro del rango de fechas', function () {
    admissionWindow();

    $window = app(AdmissionWindow::class);

    $this->travelTo(Carbon::parse('2026-10-31T12:00:00-04:00'));
    expect($window->isOpen())->toBeFalse();

    $this->travelTo(Carbon::parse('2026-11-01T08:00:00-04:00'));
    expect($window->isOpen())->toBeTrue();

    $this->travelTo(Carbon::parse('2026-11-30T23:00:00-04:00'));
    expect($window->isOpen())->toBeTrue();

    $this->travelTo(Carbon::parse('2026-12-01T00:30:00-04:00'));
    expect($window->isOpen())->toBeFalse();
});

test('el cierre y la apertura manuales tienen prioridad sobre las fechas', function () {
    $matrix = [
        [AdmissionWindowSetting::MODE_CLOSED, '2026-11-15T12:00:00-04:00', false],
        [AdmissionWindowSetting::MODE_CLOSED, '2026-12-20T12:00:00-04:00', false],
        [AdmissionWindowSetting::MODE_OPEN, '2026-10-01T12:00:00-04:00', true],
        [AdmissionWindowSetting::MODE_OPEN, '2027-03-01T12:00:00-04:00', true],
    ];

    foreach ($matrix as [$mode, $moment, $expected]) {
        AdmissionWindowSetting::query()->delete();
        admissionWindow(['mode' => $mode]);

        $this->travelTo(Carbon::parse($moment));

        expect(app(AdmissionWindow::class)->isOpen())->toBe($expected);
    }
});

test('el formulario público refleja el cierre manual de las inscripciones', function () {
    admissionWindow([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-11-30',
        'mode' => AdmissionWindowSetting::MODE_CLOSED,
    ]);
    $this->travelTo(Carbon::parse('2026-11-15T12:00:00-04:00'));

    $this->get(route('admissions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/closed')
            ->where('reason', 'manual')
        );

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canRegister', false)
        );
});

test('el formulario público indica el cierre automático al pasar la fecha final', function () {
    admissionWindow([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-11-30',
    ]);
    $this->travelTo(Carbon::parse('2026-12-02T12:00:00-04:00'));

    $this->get(route('admissions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admissions/closed')
            ->where('reason', 'after')
            ->where('closesAt', '2026-11-30T23:59:59-04:00')
        );
});
