<?php

use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\ProfessorProfile;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users without a role cannot visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertForbidden();
});

test('students are redirected to the student dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Estudiante->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index'),
        );
});

test('professors are redirected to the professor dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Profesor->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor'),
        );
});

test('professors without a subject in a schedule see the pending assignment state', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
    ]);
    $subject = Subject::factory()->for($career)->create(['semester' => 5]);
    $period = AcademicPeriod::factory()->create();

    $professor = User::factory()->create(['name' => 'Dra. Carmen Alicia Rojas']);
    $professor->assignRole(Role::Profesor->value);
    $profile = ProfessorProfile::factory()->for($professor)->create();
    $profile->subjects()->attach($subject);

    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'academic_period_id' => $period->id,
        'professor_id' => $professor->id,
    ]);

    $this->actingAs($professor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor')
            ->has('careers', 0)
            ->where('summary.careers_count', 0)
            ->where('summary.subjects_count', 0)
            ->where('summary.students_count', 0)
        );
});

test('the professor dashboard only shows the load assigned in the published schedule', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
    ]);
    $assignedSubject = Subject::factory()->for($career)->create([
        'code' => 'TIC-101',
        'name' => 'TIC I',
        'semester' => 1,
    ]);
    $foreignSubject = Subject::factory()->for($career)->create([
        'code' => 'DID-201',
        'name' => 'Didáctica de la Lectura y Escritura',
        'semester' => 2,
    ]);
    $period = AcademicPeriod::factory()->create(['name' => '2026-II']);

    $professor = User::factory()->create(['name' => 'Ana Pérez']);
    $professor->assignRole(Role::Profesor->value);
    ProfessorProfile::factory()->for($professor)->create();

    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'presencial',
    ]);
    $schedule->subjects()->attach($assignedSubject->id, [
        'position' => 1,
        'professor_id' => $professor->id,
    ]);

    $student = User::factory()->create(['name' => 'Luis Estudiante']);
    $student->assignRole(Role::Estudiante->value);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $assignedSubject->id,
        'academic_period_id' => $period->id,
    ]);

    $foreignStudent = User::factory()->create();
    $foreignStudent->assignRole(Role::Estudiante->value);
    Enrollment::factory()->create([
        'student_id' => $foreignStudent->id,
        'subject_id' => $foreignSubject->id,
        'academic_period_id' => $period->id,
    ]);

    $this->actingAs($professor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor')
            ->has('careers', 1)
            ->where('careers.0.name', 'Educación Primaria')
            ->has('careers.0.subjects', 1)
            ->where('careers.0.subjects.0.code', 'TIC-101')
            ->where('careers.0.subjects.0.cohort', '2025-II')
            ->where('careers.0.subjects.0.schedule_label', 'Sabatino')
            ->has('careers.0.subjects.0.students', 1)
            ->where('careers.0.subjects.0.students.0.student_name', 'Luis Estudiante')
            ->where('summary.careers_count', 1)
            ->where('summary.subjects_count', 1)
            ->where('summary.students_count', 1)
            ->where('summary.pending_count', 1)
        );
});

test('schedules that only record the teacher name still appear in the professor dashboard', function () {
    $career = Career::factory()->create(['name' => 'Educación Primaria']);
    $subject = Subject::factory()->for($career)->create([
        'code' => 'TIC-101',
        'name' => 'TIC I',
        'semester' => 1,
    ]);

    $professor = User::factory()->create(['name' => 'Edilia Díaz']);
    $professor->assignRole(Role::Profesor->value);
    ProfessorProfile::factory()->for($professor)->create();

    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
    ]);
    $schedule->subjects()->attach($subject->id, [
        'position' => 1,
        'teacher_name' => 'Edilia Díaz',
    ]);

    $this->actingAs($professor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('careers', 1)
            ->where('careers.0.subjects.0.code', 'TIC-101')
            ->has('careers.0.subjects.0.students', 0)
        );
});

test('graduates are redirected to the graduate dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Graduado->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/graduate'),
        );
});

test('administrative users are redirected to the admin dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::Admin->value);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect(route('admin.dashboard'));
});
