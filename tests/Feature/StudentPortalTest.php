<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\Career;
use App\Models\Enrollment;
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
            ->where('photo_url', route('student.photo', absolute: false))
            ->where('admission.documents.0.type', AdmissionDocumentType::Foto->value)
        );
});

test('el dashboard no expone avatar cuando el expediente no tiene fotografía', function () {
    [$user] = convertedStudent();

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
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
        'name' => 'Educación Alimentaria y Nutrición',
        'semester' => 1,
        'type' => 'UNCLE',
    ]);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
            ->where('profile.modality', 'Presencial')
            ->where('profile.duration_semesters', 8)
            ->where('pensum.0.semester', 1)
            ->where('pensum.0.subjects.0.is_elective', false)
            ->where('pensum.0.subjects.1.is_elective', true)
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('schedule.cohort', '2025-II')
            ->where('schedule.schedule_label', 'Sabatino')
        );

    $this->actingAs($differentOfferingStudent)
        ->get(route('student.dashboard'))
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
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('studentNotifications.unread_count', 2)
            ->has('studentNotifications.items', 2)
            ->where('studentNotifications.items.0.title', 'Horario de clases')
            ->where('studentNotifications.items.0.message', 'Se ha publicado tu horario de clases.')
        );

    $this->actingAs($user)
        ->from(route('student.dashboard'))
        ->patch(route('student.notifications.read', $notification->id))
        ->assertRedirect(route('student.dashboard'));

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

    $professorProfile = ProfessorProfile::factory()->for($professor)->create([
        'department' => 'Lengua y Literatura',
        'academic_title' => 'Magíster en Educación',
    ]);
    $professorProfile->subjects()->attach($subjects->first());

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
            ->component('Student/Dashboard/Index')
            ->has('subjects', 2)
            ->where('subjects.0.code', $subjects->first()->code)
            ->where('subjects.0.subject', $subjects->first()->name)
            ->where('subjects.0.professor', 'Ana Pérez')
            ->where('subjects.0.professor_id', $professor->id)
            ->where('subjects.0.professor_url', '/estudiante/profesores/'.$professor->id)
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
            ->where('teachers.0.profile_url', '/estudiante/profesores/'.$professor->id)
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
            ->component('Student/Professor/Show')
            ->where('professor.name', 'Ana Pérez')
            ->where('professor.email', $professor->email)
            ->where('professor.department', 'Lengua y Literatura')
            ->where('professor.academic_title', 'Magíster en Educación')
            ->where('professor.assigned_in_schedule', true)
            ->has('professor.subjects', 1)
            ->where('professor.subjects.0.code', $subjects->first()->code)
            ->where('professor.subjects.0.name', $subjects->first()->name)
            ->where('professor.subjects.0.modality', 'Presencial')
            ->where('subjects_url', '/dashboard?tab=materias')
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
