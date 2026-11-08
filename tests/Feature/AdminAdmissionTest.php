<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Enums\Role;
use App\Mail\AdmissionConverted;
use App\Mail\AdmissionStatusChanged;
use App\Models\Admission;
use App\Models\CareerOffering;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Adjunta los cuatro documentos obligatorios a una solicitud.
 */
function attachCompleteAdmissionDocuments(Admission $admission): void
{
    foreach (AdmissionDocumentType::cases() as $type) {
        $admission->documents()->create([
            'type' => $type->value,
            'status' => AdmissionDocumentStatus::Validado->value,
            'original_name' => $type->value.'.pdf',
            'path' => 'admissions/'.$admission->code.'/'.$type->value.'.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024,
        ]);
    }
}

/**
 * Crea un usuario administrativo con el rol indicado.
 */
function adminUserWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

/**
 * Construye los datos editables de una solicitud.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function admissionUpdatePayload(Admission $admission, array $overrides = []): array
{
    return array_merge([
        'first_name' => $admission->first_name,
        'last_name' => $admission->last_name,
        'nationality' => $admission->nationality,
        'id_number' => $admission->id_number,
        'birth_date' => $admission->birth_date->toDateString(),
        'gender' => $admission->gender,
        'email' => $admission->email,
        'phone' => $admission->phone,
        'address' => $admission->address,
        'career_id' => $admission->career_id,
        'modality' => $admission->modality,
        'schedule' => $admission->schedule,
        'shift' => $admission->shift,
        'high_school' => $admission->high_school,
        'high_school_year' => $admission->high_school_year,
        'high_school_average' => $admission->high_school_average,
    ], $overrides);
}

test('los invitados son redirigidos al login administrativo', function () {
    $this->get(route('admin.admissions.index'))
        ->assertRedirect(route('admin.login'));
});

test('los estudiantes no pueden acceder a la bandeja de admisiones', function () {
    $student = adminUserWithRole(Role::Estudiante->value);

    $this->actingAs($student)
        ->get(route('admin.admissions.index'))
        ->assertRedirect(route('dashboard'));
});

test('el personal administrativo no tiene permiso de admisiones', function () {
    $staff = adminUserWithRole(Role::PersonalAdministrativo->value);

    $this->actingAs($staff)
        ->get(route('admin.admissions.index'))
        ->assertForbidden();
});

test('el coordinador académico puede consultar admisiones pero no gestionarlas con permisos de solo lectura', function () {
    $coordinator = adminUserWithRole(Role::CoordinadorAcademico->value);
    $coordinator->givePermissionTo(Permission::AdmissionsView->value);

    $this->actingAs($coordinator)
        ->get(route('admin.admissions.index'))
        ->assertOk();

    $admission = Admission::factory()->create();

    $this->get(route('admin.admissions.show', ['admission' => $admission->code]))
        ->assertOk();

    $this->patch(route('admin.admissions.status', ['admission' => $admission->code]), [
        'status' => AdmissionStatus::EnRevision->value,
    ])->assertForbidden();
});

test('el decano puede consultar admisiones sin cambiar su estado', function () {
    $dean = adminUserWithRole(Role::Decano->value);
    $admission = Admission::factory()->create();

    $this->actingAs($dean)
        ->get(route('admin.admissions.index'))
        ->assertOk();

    $this->get(route('admin.admissions.show', ['admission' => $admission->code]))
        ->assertOk();

    $this->patch(route('admin.admissions.status', ['admission' => $admission->code]), [
        'status' => AdmissionStatus::EnRevision->value,
    ])->assertForbidden();

    expect($admission->fresh()->status)->toBe(AdmissionStatus::Recibida->value);
});

test('el administrador tiene permisos para editar y eliminar solicitudes', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    expect($admin->can(Permission::AdmissionsEdit->value))->toBeTrue()
        ->and($admin->can(Permission::AdmissionsDelete->value))->toBeTrue();

    $this->actingAs($admin)
        ->get(route('admin.admissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('admissions.data.0.can_edit', true)
            ->where('admissions.data.0.can_delete', true)
        );

    $this->get(route('admin.admissions.edit', ['admission' => $admission->code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/admissions/edit')
            ->where('update_url', route('admin.admissions.update', ['admission' => $admission->code]))
            ->where('show_url', route('admin.admissions.show', ['admission' => $admission->code]))
        );
});

test('el decano puede consultar solicitudes pero no editarlas ni eliminarlas', function () {
    $dean = adminUserWithRole(Role::Decano->value);
    $admission = Admission::factory()->create();

    expect($dean->can(Permission::AdmissionsEdit->value))->toBeFalse()
        ->and($dean->can(Permission::AdmissionsDelete->value))->toBeFalse();

    $this->actingAs($dean)
        ->get(route('admin.admissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('admissions.data.0.can_edit', false)
            ->where('admissions.data.0.can_delete', false)
        );

    $this->get(route('admin.admissions.edit', ['admission' => $admission->code]))
        ->assertForbidden();

    $this->put(route('admin.admissions.update', ['admission' => $admission->code]), [])
        ->assertForbidden();

    $this->delete(route('admin.admissions.destroy', ['admission' => $admission->code]))
        ->assertForbidden();

    $this->assertDatabaseHas('admissions', ['id' => $admission->id]);
});

test('el administrador edita los datos sin alterar estado ni documentos', function () {
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create([
        'status' => AdmissionStatus::EnRevision->value,
    ]);
    $path = 'admissions/'.$admission->id_number.'/titulo_bachiller/document.pdf';
    Storage::disk('local')->put($path, "%PDF-1.4\n%%EOF");

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'titulo.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 14,
    ]);
    $admission->statusHistories()->create([
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::EnRevision->value,
        'note' => 'Expediente en revisión.',
        'changed_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.admissions.update', ['admission' => $admission->code]), admissionUpdatePayload($admission, [
            'first_name' => '  maria   elena ',
            'high_school' => '  Unidad   Educativa Central ',
        ]))
        ->assertRedirect(route('admin.admissions.show', ['admission' => $admission->code]))
        ->assertSessionHasNoErrors();

    expect($admission->fresh()->first_name)->toBe('Maria Elena')
        ->and($admission->fresh()->high_school)->toBe('Unidad Educativa Central')
        ->and($admission->fresh()->status)->toBe(AdmissionStatus::EnRevision->value)
        ->and($admission->statusHistories()->count())->toBe(1)
        ->and($document->fresh()->status)->toBe(AdmissionDocumentStatus::Pendiente->value)
        ->and(Storage::disk('local')->exists($path))->toBeTrue();
});

test('no se puede cambiar la cédula mientras haya documentos asociados', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'titulo.pdf',
        'path' => 'admissions/'.$admission->id_number.'/titulo.pdf',
        'mime_type' => 'application/pdf',
        'size' => 14,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.admissions.update', ['admission' => $admission->code]), admissionUpdatePayload($admission, [
            'id_number' => '98765432',
        ]))
        ->assertSessionHasErrors([
            'id_number' => 'No puedes cambiar la cédula mientras la solicitud tenga documentos cargados.',
        ]);

    expect($admission->fresh()->id_number)->not->toBe('98765432');
});

test('no se puede actualizar una solicitud con una oferta académica no disponible', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create([
        'modality' => 'presencial',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
    ]);

    $this->actingAs($admin)
        ->put(route('admin.admissions.update', ['admission' => $admission->code]), admissionUpdatePayload($admission, [
            'shift' => 'nocturno',
        ]))
        ->assertSessionHasErrors([
            'shift' => 'La combinación de carrera, modalidad, horario y turno no está disponible.',
        ]);

    expect($admission->fresh()->shift)->toBe('diurno');
});

test('el administrador puede cambiar la oferta a otra combinación activa', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create([
        'modality' => 'presencial',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
    ]);
    CareerOffering::query()->updateOrCreate([
        'career_id' => $admission->career_id,
        'modality' => 'presencial',
        'schedule' => 'sabatino',
        'shift' => 'nocturno',
    ], [
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.admissions.update', ['admission' => $admission->code]), admissionUpdatePayload($admission, [
            'schedule' => 'sabatino',
            'shift' => 'nocturno',
        ]))
        ->assertSessionHasNoErrors();

    expect($admission->fresh()->schedule)->toBe('sabatino')
        ->and($admission->fresh()->shift)->toBe('nocturno');
});

test('el administrador elimina una solicitud y sus documentos privados e historial', function () {
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    $path = 'admissions/'.$admission->id_number.'/titulo_bachiller/document.pdf';
    Storage::disk('local')->put($path, "%PDF-1.4\n%%EOF");
    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'titulo.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 14,
    ]);
    $history = $admission->statusHistories()->create([
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::EnRevision->value,
        'note' => 'Expediente en revisión.',
        'changed_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.admissions.destroy', ['admission' => $admission->code]))
        ->assertRedirect(route('admin.admissions.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('admissions', ['id' => $admission->id]);
    $this->assertDatabaseMissing('admission_documents', ['id' => $document->id]);
    $this->assertDatabaseMissing('admission_status_histories', ['id' => $history->id]);
    expect(Storage::disk('local')->exists($path))->toBeFalse();
});

test('las solicitudes convertidas no se pueden editar ni eliminar', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $student = User::factory()->create();
    $admission = Admission::factory()->create([
        'converted_user_id' => $student->id,
        'status' => AdmissionStatus::Convertida->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.edit', ['admission' => $admission->code]))
        ->assertForbidden();

    $this->put(route('admin.admissions.update', ['admission' => $admission->code]), admissionUpdatePayload($admission))
        ->assertForbidden();

    $this->delete(route('admin.admissions.destroy', ['admission' => $admission->code]))
        ->assertForbidden();

    $this->assertDatabaseHas('admissions', ['id' => $admission->id]);
});

test('solo el administrador puede ver el perfil y la carpeta privada del estudiante', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $dean = adminUserWithRole(Role::Decano->value);
    $student = User::factory()->create(['name' => 'Ana Estudiante']);
    $profile = StudentProfile::factory()->for($student)->create([
        'student_code' => 'EST-2027-301',
    ]);
    $admission = Admission::factory()->create([
        'id_number' => '12345678',
        'converted_user_id' => $student->id,
    ]);
    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'titulo.pdf',
        'path' => 'admissions/12345678/titulo_bachiller/document.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/students/show')
            ->where('student.student_code', 'EST-2027-301')
            ->where('student.name', 'Ana Estudiante')
            ->where('can_view_documents', true)
            ->where('document_folder', 'V-12345678')
            ->has('documents', 1)
            ->where('documents.0.original_name', 'titulo.pdf')
            ->where('documents.0.download_url', route('admin.admissions.documents.download', [
                'admission' => $admission->code,
                'document' => $document->id,
            ]))
        );

    $this->actingAs($dean)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertForbidden();
});

test('el personal administrativo no puede ver perfiles estudiantiles aunque tenga permiso', function () {
    $staff = adminUserWithRole(Role::PersonalAdministrativo->value);
    $staff->givePermissionTo(Permission::StudentsView->value);
    $student = User::factory()->create();
    $profile = StudentProfile::factory()->for($student)->create();

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertForbidden();
});

test('el administrador ve y administra estudiantes desde el listado', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $student = User::factory()->create(['name' => 'Ana Estudiante']);
    $profile = StudentProfile::factory()->for($student)->create([
        'student_code' => 'EST-2027-301',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.cells.student', 'Ana Estudiante')
            ->where('rows.0.url', null)
            ->where('rows.0.actions.view_url', route('admin.students.show', ['student' => $profile->student_code]))
            ->where('rows.0.actions.edit_url', route('admin.students.edit', ['student' => $profile->student_code]))
            ->where('rows.0.actions.delete_url', route('admin.students.destroy', ['student' => $profile->student_code]))
        );

    $this->get(route('admin.students.edit', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/students/edit')
            ->where('student.student_code', $profile->student_code)
        );
});

test('el decano solo ve el listado estudiantil y no tiene acciones sobre perfiles', function () {
    $dean = adminUserWithRole(Role::Decano->value);
    $student = User::factory()->create();
    $profile = StudentProfile::factory()->for($student)->create();

    $this->actingAs($dean)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.url', null)
            ->where('rows.0.actions', null)
        );

    $this->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertForbidden();

    $this->get(route('admin.students.edit', ['student' => $profile->student_code]))
        ->assertForbidden();

    $this->put(route('admin.students.update', ['student' => $profile->student_code]), [])
        ->assertForbidden();

    $this->delete(route('admin.students.destroy', ['student' => $profile->student_code]))
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $student->id]);
});

test('el administrador puede editar los datos de un estudiante y no duplicar su correo', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $student = User::factory()->create([
        'name' => 'Ana Estudiante',
        'email' => 'ana@example.com',
    ]);
    $profile = StudentProfile::factory()->for($student)->create([
        'student_code' => 'EST-2027-302',
        'phone' => '04141234567',
        'address' => 'Caracas',
    ]);
    User::factory()->create(['email' => 'otro@example.com']);

    $this->actingAs($admin)
        ->put(route('admin.students.update', ['student' => $profile->student_code]), [
            'name' => 'Ana María Estudiante',
            'email' => 'ana@example.com',
            'student_code' => 'EST-2027-302',
            'career_id' => $profile->career_id,
            'current_semester' => 3,
            'status' => 'activo',
            'phone' => '04149876543',
            'personal_email' => null,
            'address' => 'Valencia',
            'birth_date' => null,
            'birth_place' => null,
            'emergency_contact' => null,
            'shift' => null,
            'advisor' => null,
            'admission_year' => 2027,
            'graduation_year' => null,
        ])
        ->assertRedirect(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertSessionHasNoErrors();

    expect($student->fresh()->name)->toBe('Ana María Estudiante')
        ->and($profile->fresh()->current_semester)->toBe(3)
        ->and($profile->fresh()->address)->toBe('Valencia');

    $this->put(route('admin.students.update', ['student' => $profile->student_code]), [
        'name' => 'Ana María Estudiante',
        'email' => 'otro@example.com',
        'student_code' => 'EST-2027-302',
        'career_id' => $profile->career_id,
        'current_semester' => 3,
        'status' => 'activo',
    ])->assertSessionHasErrors('email');
});

test('el administrador elimina permanentemente la cuenta y conserva la solicitud histórica', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $student = User::factory()->create();
    $profile = StudentProfile::factory()->for($student)->create();
    $admission = Admission::factory()->create([
        'converted_user_id' => $student->id,
        'status' => AdmissionStatus::Convertida->value,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.students.destroy', ['student' => $profile->student_code]))
        ->assertRedirect(route('admin.module', ['module' => 'students']))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('users', ['id' => $student->id]);
    $this->assertDatabaseMissing('student_profiles', ['id' => $profile->id]);
    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => null,
    ]);
});

test('el administrador no puede eliminar su propia cuenta', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $profile = StudentProfile::factory()->for($admin)->create();

    $this->actingAs($admin)
        ->delete(route('admin.students.destroy', ['student' => $profile->student_code]))
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});

test('el administrador puede filtrar solicitudes por estado y búsqueda', function () {
    $admin = adminUserWithRole(Role::Admin->value);

    Admission::factory()->create([
        'code' => 'ASP-2027-000101',
        'first_name' => 'María',
        'status' => AdmissionStatus::Aprobada->value,
    ]);

    Admission::factory()->create([
        'code' => 'ASP-2027-000102',
        'first_name' => 'José',
        'status' => AdmissionStatus::Recibida->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.index', [
            'status' => AdmissionStatus::Aprobada->value,
            'search' => 'María',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('admissions.data', 1)
            ->where('admissions.data.0.code', 'ASP-2027-000101')
            ->where('filters.status', AdmissionStatus::Aprobada->value)
            ->where('filters.search', 'María')
        );
});

test('las solicitudes convertidas ya no aparecen en la bandeja de admisiones', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $student = User::factory()->create();
    Admission::factory()->create(['code' => 'ASP-2027-000120']);
    Admission::factory()->create([
        'code' => 'ASP-2027-000121',
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $student->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('admissions.data', 1)
            ->where('admissions.total', 1)
            ->where('stats.0.value', '1')
            ->has('statuses', 5)
        );

    $this->get(route('admin.admissions.index', ['status' => AdmissionStatus::Convertida->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('admissions.data', 0)
            ->where('admissions.total', 0)
        );
});

test('el expediente convertido lleva al perfil del estudiante y no expone ese enlace al decano', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $dean = adminUserWithRole(Role::Decano->value);
    $student = User::factory()->create();
    $profile = StudentProfile::factory()->for($student)->create();
    $admission = Admission::factory()->create([
        'converted_user_id' => $student->id,
        'status' => AdmissionStatus::Convertida->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.show', ['admission' => $admission->code]))
        ->assertRedirect(route('admin.students.show', ['student' => $profile->student_code]));

    $this->actingAs($dean)
        ->get(route('admin.admissions.show', ['admission' => $admission->code]))
        ->assertForbidden();
});

test('el administrador puede cambiar el estado y notificar al aspirante', function () {
    Mail::fake();

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.admissions.status', [
            'admission' => $admission->code,
        ]), [
            'status' => AdmissionStatus::EnRevision->value,
            'note' => 'Tu expediente está siendo evaluado.',
        ])
        ->assertSessionHasNoErrors();

    $admission->refresh();

    expect($admission->status)->toBe(AdmissionStatus::EnRevision->value)
        ->and($admission->reviewed_by)->toBe($admin->id)
        ->and($admission->reviewed_at)->not->toBeNull()
        ->and($admission->statusHistories()->count())->toBe(1);

    Mail::assertQueued(AdmissionStatusChanged::class);
});

test('no se puede aprobar una solicitud con documentos pendientes', function () {
    Mail::fake();

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.admissions.status', [
            'admission' => $admission->code,
        ]), [
            'status' => AdmissionStatus::Aprobada->value,
        ])
        ->assertSessionHasErrors('status');

    expect($admission->fresh()->status)->toBe(AdmissionStatus::Recibida->value);
});

test('se puede aprobar una solicitud con el expediente completo', function () {
    Mail::fake();

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    attachCompleteAdmissionDocuments($admission);

    $this->actingAs($admin)
        ->patch(route('admin.admissions.status', [
            'admission' => $admission->code,
        ]), [
            'status' => AdmissionStatus::Aprobada->value,
            'note' => 'Expediente verificado.',
        ])
        ->assertSessionHasNoErrors();

    expect($admission->fresh()->status)->toBe(AdmissionStatus::Aprobada->value);
});

test('el administrador puede validar o rechazar un documento', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/'.$admission->code.'/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.admissions.documents.review', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]), [
            'status' => AdmissionDocumentStatus::Rechazado->value,
            'notes' => 'La cédula está vencida.',
        ])
        ->assertSessionHasNoErrors();

    $document->refresh();

    expect($document->status)->toBe(AdmissionDocumentStatus::Rechazado->value)
        ->and($document->notes)->toBe('La cédula está vencida.')
        ->and($document->reviewed_by)->toBe($admin->id);

    $this->assertDatabaseHas('admission_status_histories', [
        'admission_id' => $admission->id,
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::Recibida->value,
        'note' => 'Se ha rechazado tu Cédula de identidad. Debes cargarlo nuevamente. Motivo: La cédula está vencida.',
        'changed_by' => $admin->id,
    ]);

    $this->get($admission->trackingUrl())
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('admission.history.0.title', 'Se ha rechazado tu Cédula de identidad. Debes cargarlo nuevamente. Motivo: La cédula está vencida.')
            ->where('admission.history.0.changed_by', $admin->name)
        );
});

test('el administrador registra en el historial cuando valida un documento', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/'.$admission->code.'/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.admissions.documents.review', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]), [
            'status' => AdmissionDocumentStatus::Validado->value,
        ])
        ->assertSessionHasNoErrors();

    expect($document->fresh()->status)->toBe(AdmissionDocumentStatus::Validado->value);

    $this->assertDatabaseHas('admission_status_histories', [
        'admission_id' => $admission->id,
        'from_status' => AdmissionStatus::Recibida->value,
        'to_status' => AdmissionStatus::Recibida->value,
        'note' => 'Se ha validado tu Cédula de identidad.',
        'changed_by' => $admin->id,
    ]);
});

test('el administrador puede descargar un documento del expediente', function () {
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    $path = 'admissions/'.$admission->code.'/notas.pdf';

    Storage::disk('local')->put($path, 'contenido');

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::NotasCertificadas->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'notas.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 9,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.documents.download', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]))
        ->assertOk()
        ->assertDownload('notas.pdf');
});

test('el administrador puede abrir un documento en una pestaña nueva', function () {
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    $path = 'admissions/'.$admission->code.'/notas.pdf';

    Storage::disk('local')->put($path, "%PDF-1.4\n%%EOF");

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::NotasCertificadas->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'notas.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 14,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.admissions.documents.preview', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]))
        ->assertOk();

    expect($response->headers->get('content-type'))->toContain('application/pdf')
        ->and($response->headers->get('content-disposition'))->toStartWith('inline');
});

test('no se puede previsualizar un documento de otra solicitud', function () {
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();
    $other = Admission::factory()->create();
    $path = 'admissions/'.$other->code.'/notas.pdf';

    Storage::disk('local')->put($path, "%PDF-1.4\n%%EOF");

    $document = $other->documents()->create([
        'type' => AdmissionDocumentType::NotasCertificadas->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'notas.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 14,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.admissions.documents.preview', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]))
        ->assertNotFound();
});

test('un aspirante aprobado se convierte en estudiante con su perfil', function () {
    Mail::fake();
    Storage::fake('local');

    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->approved()->create();
    attachCompleteAdmissionDocuments($admission);

    $this->actingAs($admin)
        ->post(route('admin.admissions.convert', [
            'admission' => $admission->code,
        ]))
        ->assertSessionHasNoErrors();

    $user = User::query()->where('email', $admission->email)->firstOrFail();

    expect($user->hasRole(Role::Estudiante->value))->toBeTrue()
        ->and($user->studentProfile)->not->toBeNull()
        ->and($user->studentProfile->student_code)->toBe('EST-2027-001')
        ->and($user->studentProfile->career_id)->toBe($admission->career_id)
        ->and($user->studentProfile->admission_year)->toBe(2027)
        ->and(Hash::check($admission->id_number, $user->password))->toBeTrue()
        ->and($user->needsPasswordChange())->toBeTrue();

    expect(Storage::disk('local')->directoryExists('admissions/'.$admission->id_number))
        ->toBeTrue();

    $admission->refresh();

    expect($admission->status)->toBe(AdmissionStatus::Convertida->value)
        ->and($admission->converted_user_id)->toBe($user->id)
        ->and($admission->converted_at)->not->toBeNull();

    Mail::assertQueued(AdmissionConverted::class);
});

test('solo las solicitudes aprobadas pueden convertirse en estudiantes', function () {
    $admin = adminUserWithRole(Role::Admin->value);
    $admission = Admission::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.admissions.convert', [
            'admission' => $admission->code,
        ]))
        ->assertStatus(422);

    expect(User::query()->where('email', $admission->email)->exists())->toBeFalse();
});
