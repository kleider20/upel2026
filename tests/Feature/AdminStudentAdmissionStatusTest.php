<?php

use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Enums\Role;
use App\Mail\AdmissionStatusChanged;
use App\Models\Admission;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Estudiante con una solicitud de admisión vinculada y todavía abierta.
 *
 * @return array{User, StudentProfile, Admission}
 */
function studentStatusContext(AdmissionStatus $status = AdmissionStatus::EnRevision): array
{
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    $profile = StudentProfile::factory()->for($user)->create([
        'student_code' => 'EST-2027-902',
    ]);

    $admission = Admission::factory()->create([
        'status' => $status->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
    ]);

    return [$user, $profile, $admission];
}

/**
 * Usuario administrativo con el rol indicado.
 */
function studentStatusStaff(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('el administrador y el decano actualizan el estado de la solicitud desde el perfil del estudiante', function (string $role) {
    Mail::fake();

    [, $profile, $admission] = studentStatusContext();
    $staff = studentStatusStaff($role);

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/students/show')
            ->where('can_update_status', true)
            ->where('status_update.url', route('admin.admissions.status', ['admission' => $admission->code]))
            ->has('status_update.transitions', 3)
            ->where('status_update.transitions.0.value', AdmissionStatus::Observada->value)
        );

    $this->patch(route('admin.admissions.status', ['admission' => $admission->code]), [
        'status' => AdmissionStatus::Observada->value,
        'note' => 'Falta la fotografía tipo carnet actualizada.',
    ])->assertSessionHasNoErrors();

    $admission->refresh();

    expect($admission->status)->toBe(AdmissionStatus::Observada->value)
        ->and($admission->reviewed_by)->toBe($staff->id)
        ->and($admission->statusHistories()->count())->toBe(1);

    Mail::assertQueued(AdmissionStatusChanged::class);
})->with([
    'administrador' => Role::Admin->value,
    'decano' => Role::Decano->value,
]);

test('un rol sin el permiso de estado no ve el formulario ni puede actualizar la solicitud', function () {
    [, $profile, $admission] = studentStatusContext();
    $staff = studentStatusStaff(Role::PersonalAdministrativo->value);
    $staff->givePermissionTo([
        Permission::StudentsView->value,
        Permission::StudentsViewPrivate->value,
        Permission::AdmissionsView->value,
    ]);

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_view_private', true)
            ->where('can_update_status', false)
            ->where('status_update', null)
        );

    $this->patch(route('admin.admissions.status', ['admission' => $admission->code]), [
        'status' => AdmissionStatus::Observada->value,
        'note' => 'Intento sin permiso.',
    ])->assertForbidden();

    expect($admission->fresh()->status)->toBe(AdmissionStatus::EnRevision->value);
});

test('una solicitud convertida se muestra sin transiciones manuales', function () {
    [, $profile, $admission] = studentStatusContext(AdmissionStatus::Convertida);
    $admin = studentStatusStaff(Role::Admin->value);

    $this->actingAs($admin)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_update_status', true)
            ->where('status_update.url', route('admin.admissions.status', ['admission' => $admission->code]))
            ->has('status_update.transitions', 0)
        );

    $this->patch(route('admin.admissions.status', ['admission' => $admission->code]), [
        'status' => AdmissionStatus::Observada->value,
        'note' => 'No debería aplicarse.',
    ])->assertSessionHasErrors('status');

    expect($admission->fresh()->status)->toBe(AdmissionStatus::Convertida->value);
});

test('el perfil administrativo muestra el historial de la solicitud', function () {
    [, $profile, $admission] = studentStatusContext();
    $admin = studentStatusStaff(Role::Admin->value);

    $admission->statusHistories()->create([
        'from_status' => null,
        'to_status' => AdmissionStatus::Recibida->value,
        'note' => 'Solicitud recibida desde el formulario público.',
    ]);

    $admission->statusHistories()->create([
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::EnRevision->value,
        'note' => 'Comenzó la revisión del expediente.',
        'changed_by' => $admin->id,
    ]);

    $admission->statusHistories()->create([
        'from_status' => AdmissionStatus::EnRevision->value,
        'to_status' => AdmissionStatus::EnRevision->value,
        'note' => 'Se ha validado tu Cédula de identidad.',
        'changed_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('history', 3)
            ->where('history.0.title', 'Se ha validado tu Cédula de identidad.')
            ->where('history.0.note', null)
            ->where('history.0.changed_by', $admin->name)
            ->where('history.1.title', AdmissionStatus::EnRevision->label())
            ->where('history.1.note', 'Comenzó la revisión del expediente.')
            ->where('history.2.title', AdmissionStatus::Recibida->label())
            ->where('history.2.note', 'Solicitud recibida desde el formulario público.')
            ->where('history.2.changed_by', 'Sistema')
        );
});

test('el historial no se expone a roles sin acceso a la información privada', function () {
    [, $profile, $admission] = studentStatusContext();

    $admission->statusHistories()->create([
        'from_status' => null,
        'to_status' => AdmissionStatus::Recibida->value,
        'note' => 'Solicitud recibida desde el formulario público.',
    ]);

    $staff = studentStatusStaff(Role::PersonalAdministrativo->value);
    $staff->givePermissionTo(Permission::StudentsView->value);

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_view_private', false)
            ->where('history', [])
        );
});
