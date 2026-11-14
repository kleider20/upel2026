<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Enums\Role;
use App\Models\Admission;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Estudiante convertido con un expediente listo para recibir solicitudes.
 *
 * @return array{User, StudentProfile, Admission}
 */
function reviewRequestStudent(string $name = 'Ana Estudiante'): array
{
    $user = User::factory()->create(['name' => $name, 'must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    $profile = StudentProfile::factory()->for($user)->create([
        'student_code' => 'EST-2027-901',
    ]);

    $admission = Admission::factory()->create([
        'id_number' => '12345678',
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
    ]);

    return [$user, $profile, $admission];
}

/**
 * Usuario administrativo con un rol determinado.
 */
function reviewRequestStaff(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('la recarga de un documento genera una solicitud de revisión en la campana administrativa', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$student, $profile, $admission] = reviewRequestStudent();
    $admin = reviewRequestStaff(Role::Admin->value);

    $this->actingAs($student)
        ->post(route('student.documents.store'), [
            'type' => AdmissionDocumentType::Foto->value,
            'document' => UploadedFile::fake()->image('foto.png'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $document = $admission->documents()
        ->where('type', AdmissionDocumentType::Foto->value)
        ->firstOrFail();

    expect($document->status)->toBe(AdmissionDocumentStatus::Pendiente->value)
        ->and($document->review_requested_at)->not->toBeNull();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('adminReviewRequests.can_review', true)
            ->where('adminReviewRequests.pending_total', 1)
            ->where('adminReviewRequests.pending_students', 1)
            ->where('adminReviewRequests.items.0.student_name', 'Ana Estudiante')
            ->where('adminReviewRequests.items.0.student_code', $profile->student_code)
            ->where('adminReviewRequests.items.0.type_label', AdmissionDocumentType::Foto->label())
            ->where('adminReviewRequests.items.0.message', 'Ana Estudiante ha solicitado revisión de documento: '.AdmissionDocumentType::Foto->label())
            ->where('adminReviewRequests.items.0.url', route('admin.students.show', ['student' => $profile->student_code]))
            ->where('adminReviewRequests.items.0.requested_at', fn ($value): bool => is_string($value) && $value !== '')
        );

    $this->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('documents.0.review_requested', true)
            ->where('documents.0.review_action_url', route('admin.admissions.documents.review', [
                'admission' => $admission->code,
                'document' => $document->id,
            ]))
        );
});

test('el listado estudiantil marca las solicitudes pendientes y las oculta a roles sin permiso privado', function () {
    [, $profile, $admission] = reviewRequestStudent();

    $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'foto.png',
        'path' => 'admissions/12345678/foto/foto.png',
        'mime_type' => 'image/png',
        'size' => 1024,
        'review_requested_at' => now(),
    ]);

    $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/12345678/cedula/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);

    $admin = reviewRequestStaff(Role::Admin->value);
    $dean = reviewRequestStaff(Role::Decano->value);
    $staff = reviewRequestStaff(Role::PersonalAdministrativo->value);
    $staff->givePermissionTo(Permission::StudentsView->value);

    $this->actingAs($admin)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.review.count', 1)
            ->where('rows.0.review.labels.0', AdmissionDocumentType::Foto->label())
            ->where('rows.0.actions.view_url', route('admin.students.show', ['student' => $profile->student_code]))
        );

    $this->actingAs($dean)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.review.count', 1)
            ->where('adminReviewRequests.can_review', true)
            ->where('adminReviewRequests.pending_students', 1)
            ->where('adminReviewRequests.pending_total', 1)
        );

    $this->actingAs($staff)
        ->get(route('admin.module', ['module' => 'students']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rows.0.review', null)
            ->where('adminReviewRequests.can_review', false)
            ->where('adminReviewRequests.pending_total', 0)
        );
});

test('al validar el documento se limpia la solicitud pendiente', function () {
    [, , $admission] = reviewRequestStudent();
    $admin = reviewRequestStaff(Role::Admin->value);

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/12345678/cedula/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
        'review_requested_at' => now(),
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.admissions.documents.review', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]), ['status' => AdmissionDocumentStatus::Validado->value])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $document->refresh();

    expect($document->status)->toBe(AdmissionDocumentStatus::Validado->value)
        ->and($document->review_requested_at)->toBeNull();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminReviewRequests.pending_total', 0)
            ->where('adminReviewRequests.pending_students', 0)
            ->where('adminReviewRequests.items', [])
        );
});

test('el administrador y el decano validan documentos actualizados desde el perfil del estudiante', function (string $role) {
    [, $profile, $admission] = reviewRequestStudent();
    $staff = reviewRequestStaff($role);

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'foto.png',
        'path' => 'admissions/12345678/foto/foto.png',
        'mime_type' => 'image/png',
        'size' => 1024,
        'review_requested_at' => now(),
    ]);

    $reviewUrl = route('admin.admissions.documents.review', [
        'admission' => $admission->code,
        'document' => $document->id,
    ]);

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_review_documents', true)
            ->has('document_statuses', 2)
            ->where('documents.0.review_requested', true)
            ->where('documents.0.review_action_url', $reviewUrl)
        );

    $this->patch($reviewUrl, [
        'status' => AdmissionDocumentStatus::Validado->value,
    ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $document->refresh();

    expect($document->status)->toBe(AdmissionDocumentStatus::Validado->value)
        ->and($document->review_requested_at)->toBeNull()
        ->and($document->reviewed_by)->toBe($staff->id);

    $this->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('documents.0.review_requested', false)
            ->where('adminReviewRequests.pending_total', 0)
        );
})->with([
    'administrador' => Role::Admin->value,
    'decano' => Role::Decano->value,
]);

test('un rol sin permiso de revisión no puede validar documentos desde el perfil', function () {
    [, $profile, $admission] = reviewRequestStudent();
    $staff = reviewRequestStaff(Role::PersonalAdministrativo->value);
    $staff->givePermissionTo([
        Permission::StudentsView->value,
        Permission::StudentsViewPrivate->value,
        Permission::AdmissionsView->value,
    ]);

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Pendiente->value,
        'original_name' => 'foto.png',
        'path' => 'admissions/12345678/foto/foto.png',
        'mime_type' => 'image/png',
        'size' => 1024,
        'review_requested_at' => now(),
    ]);

    $this->actingAs($staff)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can_view_documents', true)
            ->where('can_review_documents', false)
            ->has('document_statuses', 0)
        );

    $this->patch(route('admin.admissions.documents.review', [
        'admission' => $admission->code,
        'document' => $document->id,
    ]), ['status' => AdmissionDocumentStatus::Validado->value])
        ->assertForbidden();

    expect($document->fresh()->status)->toBe(AdmissionDocumentStatus::Pendiente->value);
});

test('el historial registra la carga y la revisión del documento para el estudiante y el personal', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$student, $profile, $admission] = reviewRequestStudent();
    $admin = reviewRequestStaff(Role::Admin->value);

    $this->actingAs($student)
        ->post(route('student.documents.store'), [
            'type' => AdmissionDocumentType::Foto->value,
            'document' => UploadedFile::fake()->image('foto.png'),
        ])
        ->assertSessionHasNoErrors();

    $document = $admission->documents()
        ->where('type', AdmissionDocumentType::Foto->value)
        ->firstOrFail();

    $this->actingAs($admin)
        ->patch(route('admin.admissions.documents.review', [
            'admission' => $admission->code,
            'document' => $document->id,
        ]), ['status' => AdmissionDocumentStatus::Validado->value])
        ->assertSessionHasNoErrors();

    $reviewTitle = 'Se ha validado tu '.AdmissionDocumentType::Foto->label().'.';
    $uploadTitle = 'Cargaste tu '.AdmissionDocumentType::Foto->label().' y solicitaste su revisión.';

    $this->actingAs($student)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
            ->has('admission.history', 2)
            ->where('admission.history.0.title', $reviewTitle)
            ->where('admission.history.0.changed_by', $admin->name)
            ->where('admission.history.0.note', null)
            ->where('admission.history.1.title', $uploadTitle)
            ->where('admission.history.1.changed_by', $student->name)
        );

    $this->actingAs($admin)
        ->get(route('admin.students.show', ['student' => $profile->student_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('history', 2)
            ->where('history.0.title', $reviewTitle)
            ->where('history.1.title', $uploadTitle)
        );
});
