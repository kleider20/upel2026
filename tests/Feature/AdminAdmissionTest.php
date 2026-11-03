<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Mail\AdmissionConverted;
use App\Mail\AdmissionStatusChanged;
use App\Models\Admission;
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

test('el coordinador académico puede ver la bandeja de admisiones', function () {
    $coordinator = adminUserWithRole(Role::CoordinadorAcademico->value);
    Admission::factory()->count(3)->create();

    $this->actingAs($coordinator)
        ->get(route('admin.admissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/admissions/index')
            ->has('admissions.data', 3)
            ->has('statuses', 6)
            ->has('stats', 4)
        );
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
