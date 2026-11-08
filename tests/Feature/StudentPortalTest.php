<?php

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Models\Admission;
use App\Models\Career;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Notifications\SchedulePublishedNotification;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Estudiante con una solicitud de admisión ya convertida.
 *
 * @param  array<string, mixed>  $attributes
 * @return array{0: User, 1: Admission}
 */
function convertedStudent(array $attributes = []): array
{
    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'student_code' => 'EST-2027-001',
        'admission_year' => 2027,
    ]);

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

    $admission->documents()->create([
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
            ->has('admission.documents', 1)
            ->where('admission.documents.0.type_label', AdmissionDocumentType::Cedula->label())
            ->where('admission.documents.0.status_label', AdmissionDocumentStatus::Validado->label())
        );
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
            'emergency_contact' => 'Ana Rodríguez · 0412-7654321',
        ])
        ->assertRedirect();

    $profile = $user->studentProfile()->firstOrFail();

    expect($profile->phone)->toBe('0414-1234567')
        ->and($profile->personal_email)->toBe('maria.personal@example.com')
        ->and($profile->address)->toBe('Av. Libertador, Caracas')
        ->and($profile->emergency_contact)->toBe('Ana Rodríguez · 0412-7654321');
});
