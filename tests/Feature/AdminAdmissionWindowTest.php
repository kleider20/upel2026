<?php

use App\Enums\Role;
use App\Models\AdmissionWindowSetting;
use App\Models\EnrollmentWindowSetting;
use App\Models\User;
use App\Support\AdmissionWindow;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Crea la ventana de preinscripción con el rango y el modo indicados.
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

/**
 * Crea la ventana de inscripción formal con el rango y el modo indicados.
 */
function enrollmentWindow(array $attributes = []): EnrollmentWindowSetting
{
    return EnrollmentWindowSetting::query()->create([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-11-30',
        'mode' => EnrollmentWindowSetting::MODE_AUTOMATIC,
        ...$attributes,
    ]);
}

test('el administrador actualiza la ventana de preinscripciones', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    $this->actingAs($admin)
        ->put(route('admin.preinscripciones.update'), [
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

    expect(EnrollmentWindowSetting::query()->exists())->toBeFalse();
});

test('el administrador actualiza la ventana de inscripciones sin tocar la preinscripción', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);
    $preinscripcion = admissionWindow([
        'opens_on' => '2026-11-02',
        'closes_on' => '2027-01-12',
    ]);

    $this->actingAs($admin)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2027-01-12',
            'closes_on' => '2027-02-28',
            'mode' => EnrollmentWindowSetting::MODE_CLOSED,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $settings = EnrollmentWindowSetting::current();

    expect($settings->opens_on->toDateString())->toBe('2027-01-12')
        ->and($settings->closes_on->toDateString())->toBe('2027-02-28')
        ->and($settings->mode)->toBe(EnrollmentWindowSetting::MODE_CLOSED)
        ->and($preinscripcion->refresh()->opens_on->toDateString())->toBe('2026-11-02');
});

test('el decano puede habilitar y deshabilitar ambas ventanas', function () {
    $dean = User::factory()->create();
    $dean->assignRole(Role::Decano->value);

    $this->actingAs($dean)
        ->put(route('admin.preinscripciones.update'), [
            'opens_on' => '2026-11-01',
            'closes_on' => '2026-11-30',
            'mode' => AdmissionWindowSetting::MODE_OPEN,
        ])
        ->assertRedirect();

    $this->actingAs($dean)
        ->put(route('admin.inscripciones.update'), [
            'opens_on' => '2026-11-01',
            'closes_on' => '2026-11-30',
            'mode' => EnrollmentWindowSetting::MODE_OPEN,
        ])
        ->assertRedirect();

    expect(AdmissionWindowSetting::current()->mode)->toBe(AdmissionWindowSetting::MODE_OPEN)
        ->and(EnrollmentWindowSetting::current()->mode)->toBe(EnrollmentWindowSetting::MODE_OPEN);
});

test('los coordinadores académicos no pueden cambiar ninguna ventana', function () {
    $coordinator = User::factory()->create();
    $coordinator->assignRole(Role::CoordinadorAcademico->value);

    foreach (['admin.inscripciones.update', 'admin.preinscripciones.update'] as $route) {
        $this->actingAs($coordinator)
            ->put(route($route), [
                'opens_on' => '2026-11-01',
                'closes_on' => '2026-11-30',
                'mode' => AdmissionWindowSetting::MODE_OPEN,
            ])
            ->assertForbidden();
    }
});

test('la fecha de cierre debe ser posterior a la fecha de inicio en ambas ventanas', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    foreach (['admin.inscripciones.update', 'admin.preinscripciones.update'] as $route) {
        $this->actingAs($admin)
            ->put(route($route), [
                'opens_on' => '2026-12-15',
                'closes_on' => '2026-11-20',
                'mode' => AdmissionWindowSetting::MODE_AUTOMATIC,
            ])
            ->assertSessionHasErrors('closes_on');

        $this->actingAs($admin)
            ->put(route($route), [
                'opens_on' => '2026-11-01',
                'closes_on' => '2026-11-30',
                'mode' => 'inventado',
            ])
            ->assertSessionHasErrors('mode');
    }
});

test('el apartado de inscripciones muestra la ventana de inscripción formal', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);
    enrollmentWindow([
        'opens_on' => '2027-01-12',
        'closes_on' => '2027-02-28',
        'mode' => EnrollmentWindowSetting::MODE_CLOSED,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.inscripciones.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/inscripciones/index')
            ->where('variant', 'inscripcion')
            ->where('update_url', '/admin/inscripciones')
            ->where('admission_window.can_manage', true)
            ->where('admission_window.opens_on', '2027-01-12')
            ->where('admission_window.closes_on', '2027-02-28')
            ->where('admission_window.mode', EnrollmentWindowSetting::MODE_CLOSED)
            ->where('admission_window.is_open', false)
            ->where('admission_window.status_label', 'Inscripciones cerradas')
        );
});

test('el apartado de preinscripciones muestra su propia ventana y sus textos', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);
    admissionWindow([
        'opens_on' => '2026-11-20',
        'closes_on' => '2026-12-15',
        'mode' => AdmissionWindowSetting::MODE_CLOSED,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.preinscripciones.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/inscripciones/index')
            ->where('variant', 'preinscripcion')
            ->where('update_url', '/admin/preinscripciones')
            ->where('admission_window.can_manage', true)
            ->where('admission_window.opens_on', '2026-11-20')
            ->where('admission_window.closes_on', '2026-12-15')
            ->where('admission_window.mode', AdmissionWindowSetting::MODE_CLOSED)
            ->where('admission_window.is_open', false)
            ->where('admission_window.status_label', 'Preinscripciones cerradas')
        );
});

test('el resto de los roles no puede abrir ningún apartado de admisión', function () {
    $coordinator = User::factory()->create();
    $coordinator->assignRole(Role::CoordinadorAcademico->value);
    admissionWindow();
    enrollmentWindow();

    $this->actingAs($coordinator)
        ->get(route('admin.preinscripciones.index'))
        ->assertForbidden();

    $this->actingAs($coordinator)
        ->get(route('admin.inscripciones.index'))
        ->assertForbidden();
});

test('en modo automático la preinscripción solo abre dentro del rango de fechas', function () {
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

test('en modo automático la inscripción solo abre dentro de su rango de fechas', function () {
    enrollmentWindow([
        'opens_on' => '2027-01-12',
        'closes_on' => '2027-02-28',
    ]);

    $window = app(AdmissionWindow::class);

    $this->travelTo(Carbon::parse('2027-01-11T12:00:00-04:00'));
    expect($window->isEnrollmentOpen())->toBeFalse();

    $this->travelTo(Carbon::parse('2027-01-12T08:00:00-04:00'));
    expect($window->isEnrollmentOpen())->toBeTrue();

    $this->travelTo(Carbon::parse('2027-02-28T23:00:00-04:00'));
    expect($window->isEnrollmentOpen())->toBeTrue();

    $this->travelTo(Carbon::parse('2027-03-01T00:30:00-04:00'));
    expect($window->isEnrollmentOpen())->toBeFalse();
});

test('el cierre y la apertura manuales tienen prioridad sobre las fechas en ambas ventanas', function () {
    $matrix = [
        [AdmissionWindowSetting::MODE_CLOSED, '2026-11-15T12:00:00-04:00', false],
        [AdmissionWindowSetting::MODE_CLOSED, '2026-12-20T12:00:00-04:00', false],
        [AdmissionWindowSetting::MODE_OPEN, '2026-10-01T12:00:00-04:00', true],
        [AdmissionWindowSetting::MODE_OPEN, '2027-03-01T12:00:00-04:00', true],
    ];

    foreach ($matrix as [$mode, $moment, $expected]) {
        AdmissionWindowSetting::query()->delete();
        EnrollmentWindowSetting::query()->delete();
        admissionWindow(['mode' => $mode]);
        enrollmentWindow(['mode' => $mode]);

        $this->travelTo(Carbon::parse($moment));

        $window = app(AdmissionWindow::class);
        expect($window->isOpen())->toBe($expected)
            ->and($window->isEnrollmentOpen())->toBe($expected);
    }
});

test('el formulario público refleja el cierre manual de las preinscripciones', function () {
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

test('la landing expone ambas ventanas para las cuentas regresivas del baner', function () {
    admissionWindow([
        'opens_on' => '2026-11-20',
        'closes_on' => '2027-01-12',
    ]);
    enrollmentWindow([
        'opens_on' => '2027-01-12',
        'closes_on' => '2027-02-28',
        'mode' => EnrollmentWindowSetting::MODE_CLOSED,
    ]);
    $this->travelTo(Carbon::parse('2026-11-19T12:00:00-04:00'));

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('admissionWindow.opens_at', '2026-11-20T08:00:00-04:00')
            ->where('admissionWindow.closes_at', '2027-01-12T23:59:59-04:00')
            ->where('admissionWindow.enrollment_opens_at', '2027-01-12T08:00:00-04:00')
            ->where('admissionWindow.enrollment_closes_at', '2027-02-28T23:59:59-04:00')
            ->where('admissionWindow.is_open', false)
            ->where('admissionWindow.is_enrollment_open', false)
            ->where('admissionWindow.preinscripcion_mode', AdmissionWindowSetting::MODE_AUTOMATIC)
            ->where('admissionWindow.inscripcion_mode', EnrollmentWindowSetting::MODE_CLOSED)
            ->where('canRegister', false)
            ->where('canEnroll', false)
        );
});
