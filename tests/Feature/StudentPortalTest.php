<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanItem;
use App\Models\EvaluationPlanScore;
use App\Models\ProfessorProfile;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Notifications\SchedulePublishedNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Estudiante con una solicitud de admisión ya convertida.
 *
 * @param  array<string, mixed>  $attributes
 * @param  array<string, mixed>  $profileAttributes
 * @return array{0: User, 1: Admission}
 */
function convertedStudent(array $attributes = [], array $profileAttributes = []): array
{
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->create(array_merge([
        'user_id' => $user->id,
        'student_code' => 'EST-2027-001',
        'admission_year' => 2027,
    ], $profileAttributes));

    $admission = Admission::factory()->create(array_merge([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'high_school' => 'Liceo Bolívar',
        'high_school_average' => 18.5,
    ], $attributes));

    return [$user, $admission];
}

test('el dashboard expone el expediente de admisión del estudiante', function () {
    [$user, $admission] = convertedStudent();

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'cedula.pdf',
        'path' => 'admissions/'.$admission->code.'/cedula.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1200,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('admission.code', $admission->code)
            ->where('admission.status', AdmissionStatus::Convertida->value)
            ->where('admission.status_label', 'Estudiante')
            ->where('admission.high_school', 'Liceo Bolívar')
            ->where('admission.high_school_average', '18,50')
            ->where('admission.formatted_id_number', $admission->formattedIdNumber())
            ->where('admission.phone', $admission->phone)
            ->where('profile.id_number', $admission->formattedIdNumber())
            ->where('profile.birth_date', $admission->birth_date->format('d/m/Y'))
            ->where('profile.admission_code', $admission->code)
            ->where('documents_upload_url', route('student.documents.store', absolute: false))
            ->has('document_types', 4)
            ->where('document_types.0.value', AdmissionDocumentType::TituloBachiller->value)
            ->has('admission.documents', 1)
            ->where('admission.documents.0.type_label', AdmissionDocumentType::Cedula->label())
            ->where('admission.documents.0.status_label', AdmissionDocumentStatus::Validado->label())
            ->where('admission.documents.0.is_previewable', true)
            ->where('admission.documents.0.preview_url', route('student.documents.preview', ['document' => $document->id], absolute: false))
            ->where('admission.documents.0.download_url', route('student.documents.download', ['document' => $document->id], absolute: false))
        );
});

test('el dashboard expone la cohorte del perfil del estudiante', function () {
    [$user] = convertedStudent([], ['cohort' => '2026-II']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('profile.cohort', '2026-II')
        );
});

test('el dashboard expone la fotografía tipo carnet del expediente como avatar', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$user, $admission] = convertedStudent();

    $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'foto.png',
        'path' => 'admissions/12345678/foto/foto.png',
        'mime_type' => 'image/png',
        'size' => 1200,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('photo_url', route('student.photo', absolute: false))
            ->where('admission.documents.0.type', AdmissionDocumentType::Foto->value)
        );
});

test('el dashboard no expone avatar cuando el expediente no tiene fotografía', function () {
    [$user] = convertedStudent();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('photo_url', null)
        );
});

test('el estudiante abre su fotografía tipo carnet desde el almacenamiento privado', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$user, $admission] = convertedStudent();

    $path = 'admissions/12345678/foto/foto.png';

    Storage::disk((string) config('admissions.documents.disk'))->put(
        $path,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='),
    );

    $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'foto.png',
        'path' => $path,
        'mime_type' => 'image/png',
        'size' => 1200,
    ]);

    $this->actingAs($user)
        ->get(route('student.photo'))
        ->assertOk()
        ->assertHeader('content-type', 'image/png')
        ->assertHeader('content-disposition', 'inline; filename=foto.png');
});

test('la fotografía no se expone a otros usuarios', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [, $admission] = convertedStudent();

    $path = 'admissions/12345678/foto/foto.png';

    Storage::disk((string) config('admissions.documents.disk'))->put(
        $path,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='),
    );

    $admission->documents()->create([
        'type' => AdmissionDocumentType::Foto->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'foto.png',
        'path' => $path,
        'mime_type' => 'image/png',
        'size' => 1200,
    ]);

    [$otherStudent] = convertedStudent([], ['student_code' => 'EST-2027-002']);

    $this->actingAs($otherStudent)->get(route('student.photo'))->assertNotFound();

    $professor = User::factory()->create(['must_change_password' => false]);
    $professor->assignRole(Role::Profesor->value);

    $this->actingAs($professor)->get(route('student.photo'))->assertForbidden();
});

test('el dashboard no inventa datos cuando no hay solicitud de admisión', function () {
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('admission', null)
            ->where('profile.id_number', null)
        );
});

test('el dashboard expone la modalidad de preinscripción y la duración del pénsum', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'modality' => 'mixta',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'modality' => 'presencial',
    ]);

    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Desarrollo de Procesos Cognitivos',
        'semester' => 1,
        'type' => 'UNCO',
    ]);
    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Uncle Del Componente De Formación Contextualizada',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'is_elective_slot' => true,
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('profile.modality', 'Presencial')
            ->where('profile.duration_semesters', 8)
            ->where('pensum.0.semester', 1)
            ->where('pensum.0.subjects.0.is_elective', false)
            ->where('pensum.0.subjects.1.is_elective', true)
        );
});

test('el pénsum del estudiante revela la materia de libre elección cuando se le asigna', function () {
    $career = Career::factory()->create([
        'code' => 'EDTEST',
        'name' => 'Educación de Prueba',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
    ]);

    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Uncle Del Componente De Formación Contextualizada',
        'code' => 'EDTEST-UNCLE-101',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'is_elective_slot' => true,
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);
    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Uncle Del Componente De Formación Profesional Específico',
        'code' => 'EDTEST-UNCLE-201',
        'semester' => 2,
        'component' => 'CFPE',
        'type' => 'UNCLE',
        'is_elective_slot' => true,
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);

    $elective = Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Educación Alimentaria y Nutrición',
        'code' => 'EAN-PA1ONLINEUNCLE',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->has('pensum.0.subjects', 1)
            ->where('pensum.0.subjects.0.name', 'Uncle Del Componente De Formación 2 2 4 Contextualizada')
            ->where('pensum.0.subjects.0.code', 'UNCLE')
            ->where('pensum.0.subjects.0.is_elective', true)
            ->where('pensum.0.subjects.0.is_assigned', false)
            ->where('pensum.1.subjects.0.name', 'Uncle Del Componente De Formación 2 2 4 Específico')
            ->where('pensum.1.subjects.0.is_assigned', false)
        );

    Enrollment::factory()->create([
        'student_id' => $user->id,
        'subject_id' => $elective->id,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('pensum.0.subjects.0.name', 'Educación Alimentaria y Nutrición')
            ->where('pensum.0.subjects.0.code', 'EAN-PA1ONLINEUNCLE')
            ->where('pensum.0.subjects.0.is_elective', true)
            ->where('pensum.0.subjects.0.is_assigned', true)
            ->where('pensum.1.subjects.0.name', 'Uncle Del Componente De Formación 2 2 4 Específico')
            ->where('pensum.1.subjects.0.is_assigned', false)
        );
});

test('el pénsum del estudiante revela la materia de libre elección agregada a su horario', function () {
    $career = Career::factory()->create([
        'code' => 'EDTEST',
        'name' => 'Educación de Prueba',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'modality' => 'presencial',
        'schedule' => 'sabatino',
    ]);

    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Uncle Del Componente De Formación Contextualizada',
        'code' => 'EDTEST-UNCLE-101',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'is_elective_slot' => true,
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);

    $elective = Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Educación Alimentaria y Nutrición',
        'code' => 'EAN-PA1ONLINEUNCLE',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);

    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2026-I',
        'study_schedule' => 'sabatino',
        'modality' => 'presencial',
    ]);
    $schedule->subjects()->attach($elective->id, ['position' => 1]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('pensum.0.subjects.0.name', 'Educación Alimentaria y Nutrición')
            ->where('pensum.0.subjects.0.code', 'EAN-PA1ONLINEUNCLE')
            ->where('pensum.0.subjects.0.is_assigned', true)
        );
});

test('el horario base del período sustituye el bloque de libre elección', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'schedule' => 'sabatino',
        'modality' => 'presencial',
    ]);

    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Uncle Del Componente De Formación Contextualizada',
        'code' => 'EDPRI-UNCLE-101',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'is_elective_slot' => true,
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);
    Subject::factory()->create([
        'career_id' => $career->id,
        'name' => 'Educación Alimentaria y Nutrición',
        'code' => 'EAN-PA1ONLINEUNCLE',
        'semester' => 1,
        'component' => 'CFC',
        'type' => 'UNCLE',
        'credits' => 2,
        'theory_hours' => 2,
        'practice_hours' => 4,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('pensum.0.subjects.0.name', 'Educación Alimentaria y Nutrición')
            ->where('pensum.0.subjects.0.code', 'EAN-PA1ONLINEUNCLE')
            ->where('pensum.0.subjects.0.is_assigned', true)
            ->where('pensum.0.subjects.0.status', 'cursando')
        );
});

test('el horario del estudiante sabatino muestra las 16 semanas del documento oficial', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'schedule' => 'sabatino',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->where('schedule.schedule_label', 'Sabatino')
            ->has('schedule.weeks', 16)
            ->where('schedule.weeks.0.day', '18')
            ->where('schedule.weeks.8.day', '10')
            ->where('schedule.weeks.15.day', '28')
            ->where('schedule.weeks.0.weekday', 'Sábado')
            ->where('schedule.weeks.15.weekday', 'Sábado')
            ->where('schedule.subjects.0.code', 'INT4380')
            ->where('schedule.subjects.0.hours.0', null)
            ->where('schedule.subjects.0.hours.2', '8')
            ->where('schedule.subjects.0.hours.8', '8')
            ->where('schedule.subjects.6.hours.0', 'Virtual')
            ->where('schedule.distance_subjects.0.hours.0', null)
            ->where('schedule.distance_subjects.6.hours.0', 'Virtual')
        );
});

it('shows only the published schedule matching the student modality and study schedule', function () {
    $career = Career::factory()->create([
        'code' => 'EDTEST',
        'duration_semesters' => 8,
    ]);
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->for($career)->for($user)->create([
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'modality' => 'mixta',
        'schedule' => 'sabatino',
    ]);

    Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
    ]);
    Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2026-I',
        'study_schedule' => 'lunes_viernes',
        'modality' => 'presencial',
    ]);

    $differentOfferingStudent = User::factory()->create(['must_change_password' => false]);
    $differentOfferingStudent->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->for($career)->for($differentOfferingStudent)->create([
        'current_semester' => 1,
    ]);
    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $differentOfferingStudent->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'modality' => 'presencial',
        'schedule' => 'sabatino',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('schedule.cohort', '2025-II')
            ->where('schedule.schedule_label', 'Sabatino')
        );

    $this->actingAs($differentOfferingStudent)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('schedule', null));
});

it('shares unread schedule notifications and marks an owned notification as read', function () {
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->for($user)->create();
    $schedule = Schedule::factory()->create();

    $user->notify(new SchedulePublishedNotification($schedule));
    $user->notify(new SchedulePublishedNotification($schedule));
    $notification = $user->unreadNotifications()->firstOrFail();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('studentNotifications.unread_count', 2)
            ->has('studentNotifications.items', 2)
            ->where('studentNotifications.items.0.title', 'Horario de clases')
            ->where('studentNotifications.items.0.message', 'Se ha publicado tu horario de clases.')
        );

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->patch(route('student.notifications.read', $notification->id))
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($notification->fresh()->read_at)->not->toBeNull();
});

it('does not allow a student to mark another users notification as read', function () {
    $student = User::factory()->create(['must_change_password' => false]);
    $student->assignRole(Role::Estudiante->value);
    StudentProfile::factory()->for($student)->create();

    $otherStudent = User::factory()->create(['must_change_password' => false]);
    $otherStudent->assignRole(Role::Estudiante->value);
    $otherProfile = StudentProfile::factory()->for($otherStudent)->create();
    $notificationSchedule = Schedule::factory()->for($otherProfile->career)->create();
    $otherStudent->notify(new SchedulePublishedNotification($notificationSchedule));
    $notification = $otherStudent->unreadNotifications()->firstOrFail();

    $this->actingAs($student)
        ->patch(route('student.notifications.read', $notification->id))
        ->assertNotFound();

    expect($notification->fresh()->read_at)->toBeNull();
});

test('el estudiante descarga su horario en PDF', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'duration_semesters' => 8,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $user->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'schedule' => 'sabatino',
    ]);

    $response = $this->actingAs($user)->get(route('student.schedule.pdf'));

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename="horario-educacion-primaria-i.pdf"');

    expect((string) $response->getContent())
        ->toStartWith('%PDF-1.4')
        ->toContain('HORARIOS DE ACTIVIDADES PRESENCIALES')
        ->toContain('Virtual')
        ->toContain('/Im1')
        ->toContain('/Im2');

    $download = $this->actingAs($user)->get(route('student.schedule.pdf', ['download' => 1]));

    $download->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'attachment; filename="horario-educacion-primaria-i.pdf"');
});

test('el estudiante actualiza sus datos de contacto', function () {
    [$user] = convertedStudent();

    $this->actingAs($user)
        ->put(route('student.profile.update'), [
            'phone' => '0414-1234567',
            'personal_email' => 'maria.personal@example.com',
            'address' => 'Av. Libertador, Caracas',
            'birth_place' => 'Caracas, Distrito Capital',
            'emergency_contact' => 'Ana Rodríguez · 0412-7654321',
        ])
        ->assertRedirect();

    $profile = $user->studentProfile()->firstOrFail();

    expect($profile->phone)->toBe('0414-1234567')
        ->and($profile->personal_email)->toBe('maria.personal@example.com')
        ->and($profile->address)->toBe('Av. Libertador, Caracas')
        ->and($profile->birth_place)->toBe('Caracas, Distrito Capital')
        ->and($profile->emergency_contact)->toBe('Ana Rodríguez · 0412-7654321');
});

test('el estudiante recarga un documento y vuelve a quedar pendiente de revisión', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$user, $admission] = convertedStudent();

    $disk = Storage::disk((string) config('admissions.documents.disk'));
    $oldPath = 'admissions/12345678/titulo_bachiller/old.pdf';
    $disk->put($oldPath, 'old');

    $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'old.pdf',
        'path' => $oldPath,
        'mime_type' => 'application/pdf',
        'size' => 3,
        'notes' => 'Documento legible.',
        'reviewed_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('student.documents.store'), [
            'type' => AdmissionDocumentType::TituloBachiller->value,
            'document' => UploadedFile::fake()->create('titulo.pdf', 120, 'application/pdf'),
        ])
        ->assertRedirect();

    $document = $admission->documents()
        ->where('type', AdmissionDocumentType::TituloBachiller->value)
        ->firstOrFail();

    expect($document->status)->toBe(AdmissionDocumentStatus::Pendiente->value)
        ->and($document->notes)->toBeNull()
        ->and($document->reviewed_at)->toBeNull()
        ->and($document->original_name)->toBe('titulo.pdf')
        ->and($document->path)->not->toBe($oldPath)
        ->and($disk->exists($oldPath))->toBeFalse()
        ->and($disk->exists($document->path))->toBeTrue();
});

test('el estudiante previsualiza y descarga sus propios documentos', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [$user, $admission] = convertedStudent();

    $path = 'admissions/12345678/titulo_bachiller/titulo.pdf';

    Storage::disk((string) config('admissions.documents.disk'))->put($path, '%PDF-1.4');

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::TituloBachiller->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'titulo.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 8,
    ]);

    $this->actingAs($user)
        ->get(route('student.documents.preview', $document->id))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    $this->actingAs($user)
        ->get(route('student.documents.download', $document->id))
        ->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename=titulo.pdf');
});

test('el estudiante no accede a documentos de otro expediente', function () {
    Storage::fake((string) config('admissions.documents.disk'));

    [, $admission] = convertedStudent();

    $path = 'admissions/12345678/cedula/cedula.pdf';

    Storage::disk((string) config('admissions.documents.disk'))->put($path, '%PDF-1.4');

    $document = $admission->documents()->create([
        'type' => AdmissionDocumentType::Cedula->value,
        'status' => AdmissionDocumentStatus::Validado->value,
        'original_name' => 'cedula.pdf',
        'path' => $path,
        'mime_type' => 'application/pdf',
        'size' => 8,
    ]);

    [$otherStudent] = convertedStudent([], ['student_code' => 'EST-2027-002']);

    $this->actingAs($otherStudent)
        ->get(route('student.documents.preview', $document->id))
        ->assertNotFound();

    $this->actingAs($otherStudent)
        ->get(route('student.documents.download', $document->id))
        ->assertNotFound();
});

/**
 * Estudiante con horario publicado y docentes asignados a sus materias.
 *
 * @return array{0: User, 1: User, 2: Schedule, 3: Collection<int, Subject>}
 */
function studentWithTeachingSchedule(): array
{
    $career = Career::factory()->create([
        'code' => 'EDTEST',
        'name' => 'Educación de Prueba',
        'duration_semesters' => 8,
    ]);

    $student = User::factory()->create(['must_change_password' => false]);
    $student->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->for($career)->for($student)->create([
        'current_semester' => 1,
    ]);

    Admission::factory()->create([
        'status' => AdmissionStatus::Convertida->value,
        'converted_user_id' => $student->id,
        'converted_at' => now(),
        'career_id' => $career->id,
        'modality' => 'presencial',
        'schedule' => 'sabatino',
    ]);

    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2026-I',
        'study_schedule' => 'sabatino',
        'modality' => 'presencial',
    ]);

    $subjects = Subject::factory()->count(2)->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);

    $professor = User::factory()->create([
        'name' => 'Ana Pérez',
        'must_change_password' => false,
    ]);
    $professor->assignRole(Role::Profesor->value);

    ProfessorProfile::factory()->for($professor)->create([
        'department' => 'Lengua y Literatura',
        'academic_title' => 'Magíster en Educación',
    ]);

    $schedule->subjects()->attach($subjects->first(), [
        'position' => 1,
        'professor_id' => $professor->id,
    ]);
    $schedule->subjects()->attach($subjects->last(), ['position' => 2]);

    return [$student, $professor, $schedule, $subjects];
}

test('mis materias muestra las materias del horario con el docente asignado', function () {
    [$student, $professor, , $subjects] = studentWithTeachingSchedule();

    $this->actingAs($student)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->has('subjects', 2)
            ->where('subjects.0.code', $subjects->first()->code)
            ->where('subjects.0.subject', $subjects->first()->name)
            ->where('subjects.0.professor', 'Ana Pérez')
            ->where('subjects.0.professor_id', $professor->id)
            ->where('subjects.0.professor_url', '/dashboard/estudiante/profesores/'.$professor->id)
            ->where('subjects.0.status', 'cursando')
            ->where('subjects.0.status_label', 'Cursando')
            ->where('subjects.0.credits', $subjects->first()->credits)
            ->where('subjects.0.modality', 'Presencial')
            ->where('subjects.1.professor_url', null)
            ->where('schedule.subjects.0.professor_id', $professor->id)
            ->where('schedule.subjects.1.professor_id', null)
        );
});

test('mis profesores lista los docentes del horario con su período', function () {
    [$student, $professor, , $subjects] = studentWithTeachingSchedule();

    $this->actingAs($student)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('teachers', 1)
            ->where('teachers.0.id', $professor->id)
            ->where('teachers.0.name', 'Ana Pérez')
            ->where('teachers.0.email', $professor->email)
            ->where('teachers.0.department', 'Lengua y Literatura')
            ->where('teachers.0.academic_title', 'Magíster en Educación')
            ->where('teachers.0.period', '2026-I')
            ->where('teachers.0.semesters', [1])
            ->where('teachers.0.subjects', [$subjects->first()->name])
            ->where('teachers.0.profile_url', '/dashboard/estudiante/profesores/'.$professor->id)
        );
});

test('mis profesores separa al mismo docente por período académico', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();

    $nextPeriod = AcademicPeriod::factory()->create(['name' => '2026-III']);
    $nextSubject = Subject::factory()->create([
        'career_id' => $subjects->first()->career_id,
        'semester' => 1,
        'modality' => 'presencial',
    ]);

    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $nextSubject->id,
        'academic_period_id' => $nextPeriod->id,
        'professor_id' => $professor->id,
    ]);

    $this->actingAs($student)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('teachers', 2)
            ->where('teachers.0.id', $professor->id)
            ->where('teachers.0.period', $schedule->cohort)
            ->where('teachers.0.subjects', [$subjects->first()->name])
            ->where('teachers.1.id', $professor->id)
            ->where('teachers.1.period', '2026-III')
            ->where('teachers.1.subjects', [$nextSubject->name])
        );
});

test('el estudiante consulta el perfil del docente asignado en su horario', function () {
    [$student, $professor, , $subjects] = studentWithTeachingSchedule();

    $this->actingAs($student)
        ->get(route('student.professors.show', $professor->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/professor/show')
            ->where('professor.name', 'Ana Pérez')
            ->where('professor.email', $professor->email)
            ->where('professor.department', 'Lengua y Literatura')
            ->where('professor.academic_title', 'Magíster en Educación')
            ->where('professor.assigned_in_schedule', true)
            ->has('professor.subjects', 1)
            ->where('professor.subjects.0.code', $subjects->first()->code)
            ->where('professor.subjects.0.name', $subjects->first()->name)
            ->where('professor.subjects.0.modality', 'Presencial')
            ->where('subjects_url', '/dashboard/estudiante/materias')
        );
});

test('el perfil del docente solo se expone a estudiantes y a docentes reales', function () {
    [$student, $professor] = studentWithTeachingSchedule();

    $this->actingAs($student)
        ->get(route('student.professors.show', $student->id))
        ->assertNotFound();

    $this->actingAs($professor)
        ->get(route('student.professors.show', $professor->id))
        ->assertForbidden();
});

/**
 * Inscribe al estudiante en una materia y crea el plan del docente con las
 * notas indicadas (null deja la evaluación sin calificar).
 *
 * @param  array<int, float|null>  $scores
 */
function enrollmentWithEvaluationPlan(
    User $student,
    User $professor,
    Schedule $schedule,
    Subject $subject,
    array $scores,
): Enrollment {
    $period = AcademicPeriod::factory()->create([
        'name' => '2026-II',
        'is_active' => true,
    ]);

    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'academic_period_id' => $period->id,
        'professor_id' => $professor->id,
    ]);

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $professor->id,
        'schedule_id' => $schedule->id,
        'subject_id' => $subject->id,
        'academic_period_id' => $period->id,
    ]);

    foreach (array_values($scores) as $index => $score) {
        $item = EvaluationPlanItem::factory()->create([
            'evaluation_plan_id' => $plan->id,
            'position' => $index + 1,
            'title' => 'Evaluación '.($index + 1),
            'weight' => 20,
            'scheduled_on' => now()->addDays($index + 1)->toDateString(),
        ]);

        if ($score === null) {
            continue;
        }

        EvaluationPlanScore::factory()->create([
            'evaluation_plan_item_id' => $item->id,
            'enrollment_id' => $enrollment->id,
            'score' => $score,
        ]);
    }

    return $enrollment;
}

test('cada elemento de la sidebar del portal del estudiante es una página independiente', function (
    string $routeName,
    string $component,
) {
    [$user] = convertedStudent();

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['dashboard', 'student/dashboard/index'],
    ['student.solicitud', 'student/solicitud/index'],
    ['student.materias', 'student/materias/index'],
    ['student.calificaciones', 'student/calificaciones/index'],
    ['student.profesores', 'student/profesores/index'],
    ['student.pensum', 'student/pensum/index'],
    ['student.horario', 'student/horario/index'],
    ['student.perfil', 'student/perfil/index'],
    ['student.tramites', 'student/tramites/index'],
]);

test('las notas del docente se reflejan en las evaluaciones y la definitiva del estudiante', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();
    $subject = $subjects->first();

    enrollmentWithEvaluationPlan(
        $student,
        $professor,
        $schedule,
        $subject,
        [20, 16, 14, 10, 18],
    );

    $this->actingAs($student)
        ->get(route('student.calificaciones'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/calificaciones/index')
            ->has('enrollments', 1)
            ->where('enrollments.0.period', '2026-II')
            ->where('enrollments.0.items_count', 5)
            ->where('enrollments.0.graded_count', 5)
            ->where('enrollments.0.definitive', 7.8)
            ->where('enrollments.0.status', 'aprobado')
            ->where('enrollments.0.status_label', 'Aprobado')
            ->has('enrollments.0.evaluations', 5)
            ->where('enrollments.0.evaluations.0.title', 'Evaluación 1')
            ->where('enrollments.0.evaluations.0.score', 20)
            ->where('enrollments.0.evaluations.0.contribution', 2)
            ->where('enrollments.0.evaluations.4.contribution', 1.8)
            ->where('recent_activity', function (Collection $activity) use ($subject): bool {
                return $activity->contains(
                    static fn (array $item): bool => $item['title'] === 'Notas de '.$subject->name.' publicadas'
                        && $item['detail'] === '5 de 5 evaluaciones calificadas',
                );
            })
            ->has('upcoming_evaluations', 0)
            ->where('summary.average', 7.8)
            ->where('summary.approved_count', 1)
            ->where('summary.pending_count', 0)
        );
});

test('el estudiante con notas pendientes aparece con la condición faltan notas', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();

    enrollmentWithEvaluationPlan(
        $student,
        $professor,
        $schedule,
        $subjects->first(),
        [20, 16, null, null, null],
    );

    $this->actingAs($student)
        ->get(route('student.calificaciones'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.graded_count', 2)
            ->where('enrollments.0.definitive', 3.6)
            ->where('enrollments.0.status', 'faltan_notas')
            ->where('enrollments.0.status_label', 'Faltan notas')
            ->where('enrollments.0.evaluations.2.score', null)
            ->has('upcoming_evaluations', 3)
            ->where('upcoming_evaluations.0.title', 'Evaluación 3')
            ->where('summary.pending_count', 1)
            ->where('summary.approved_count', 0)
        );
});

test('el estudiante con el plan completo y definitiva menor a 6 queda reprobado', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();

    enrollmentWithEvaluationPlan(
        $student,
        $professor,
        $schedule,
        $subjects->first(),
        [6, 6, 6, 6, 6],
    );

    $this->actingAs($student)
        ->get(route('student.calificaciones'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.graded_count', 5)
            ->where('enrollments.0.definitive', 3)
            ->where('enrollments.0.status', 'reprobado')
            ->where('enrollments.0.status_label', 'Reprobado')
            ->where('summary.average', 3)
        );
});

test('la materia sin plan de evaluación se mantiene en condición cursando', function () {
    [$student, $professor, , $subjects] = studentWithTeachingSchedule();

    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $subjects->first()->id,
        'professor_id' => $professor->id,
    ]);

    $this->actingAs($student)
        ->get(route('student.calificaciones'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.items_count', 0)
            ->where('enrollments.0.definitive', null)
            ->where('enrollments.0.status', 'cursando')
            ->where('enrollments.0.status_label', 'Cursando')
            ->where('summary.average', null)
        );
});

test('la actividad reciente solo refleja eventos guardados en la base de datos', function () {
    [$student] = convertedStudent();

    $this->actingAs($student)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard/index')
            ->has('recent_activity', 0)
            ->has('upcoming_evaluations', 0)
        );
});

test('la actividad reciente muestra el horario publicado al estudiante', function () {
    [$student] = convertedStudent();
    $schedule = Schedule::factory()->create();

    $student->notify(new SchedulePublishedNotification($schedule));

    $this->actingAs($student)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('recent_activity', 1)
            ->where('recent_activity.0.title', 'Horario de clases')
            ->where('recent_activity.0.detail', 'Se ha publicado tu horario de clases.')
            ->where('recent_activity.0.tone', 'blue')
        );
});

test('el pénsum marca la materia como aprobada cuando el plan del docente está completo', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();
    $subject = $subjects->first();

    enrollmentWithEvaluationPlan(
        $student,
        $professor,
        $schedule,
        $subject,
        [20, 16, 14, 10, 18],
    );

    $this->actingAs($student)
        ->get(route('student.pensum'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/pensum/index')
            ->where('pensum', function (Collection $pensum) use ($subject): bool {
                $row = $pensum
                    ->flatMap(static fn (array $group): Collection => collect($group['subjects']))
                    ->firstWhere('code', $subject->code);

                return $row !== null
                    && $row['status'] === 'aprobado'
                    && abs((float) $row['grade'] - 7.8) < 0.001;
            })
        );
});

test('el pénsum marca la materia como reprobada cuando la definitiva no aprueba', function () {
    [$student, $professor, $schedule, $subjects] = studentWithTeachingSchedule();
    $subject = $subjects->first();

    enrollmentWithEvaluationPlan(
        $student,
        $professor,
        $schedule,
        $subject,
        [6, 6, 6, 6, 6],
    );

    $this->actingAs($student)
        ->get(route('student.pensum'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('pensum', function (Collection $pensum) use ($subject): bool {
                $row = $pensum
                    ->flatMap(static fn (array $group): Collection => collect($group['subjects']))
                    ->firstWhere('code', $subject->code);

                return $row !== null && $row['status'] === 'reprobado';
            })
        );
});
