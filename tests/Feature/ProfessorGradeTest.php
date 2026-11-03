<?php

use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Crea una inscripción con su profesor, materia y período.
 *
 * @return array{professor: User, student: User, enrollment: Enrollment}
 */
function gradeScenario(): array
{
    $career = Career::factory()->create();
    $subject = Subject::factory()->for($career)->create();
    $period = AcademicPeriod::factory()->create();

    $professor = User::factory()->create();
    $professor->assignRole(Role::Profesor->value);
    $professor->taughtSubjects()->attach($subject->id);

    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);

    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'academic_period_id' => $period->id,
        'professor_id' => $professor->id,
    ]);

    return compact('professor', 'student', 'enrollment');
}

test('professors can register an approved grade', function () {
    ['professor' => $professor, 'enrollment' => $enrollment] = gradeScenario();

    $response = $this->actingAs($professor)->put(
        route('professor.grades.update', $enrollment),
        ['final_grade' => 8.5],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('enrollments', [
        'id' => $enrollment->id,
        'final_grade' => 8.5,
        'status' => 'aprobado',
    ]);
});

test('professors can register a failing grade', function () {
    ['professor' => $professor, 'enrollment' => $enrollment] = gradeScenario();

    $this->actingAs($professor)->put(
        route('professor.grades.update', $enrollment),
        ['final_grade' => 4.9],
    );

    $this->assertDatabaseHas('enrollments', [
        'id' => $enrollment->id,
        'final_grade' => 4.9,
        'status' => 'reprobado',
    ]);
});

test('grades must be between zero and ten', function () {
    ['professor' => $professor, 'enrollment' => $enrollment] = gradeScenario();

    $response = $this->actingAs($professor)->put(
        route('professor.grades.update', $enrollment),
        ['final_grade' => 10.1],
    );

    $response->assertSessionHasErrors('final_grade');

    $this->assertDatabaseHas('enrollments', [
        'id' => $enrollment->id,
        'final_grade' => null,
    ]);
});

test('professors cannot grade subjects they do not teach', function () {
    ['enrollment' => $enrollment] = gradeScenario();

    $otherProfessor = User::factory()->create();
    $otherProfessor->assignRole(Role::Profesor->value);

    $this->actingAs($otherProfessor)
        ->put(route('professor.grades.update', $enrollment), [
            'final_grade' => 9.0,
        ])
        ->assertForbidden();
});

test('students cannot register grades', function () {
    ['student' => $student, 'enrollment' => $enrollment] = gradeScenario();

    $this->actingAs($student)
        ->put(route('professor.grades.update', $enrollment), [
            'final_grade' => 9.0,
        ])
        ->assertForbidden();
});

test('guests cannot register grades', function () {
    ['enrollment' => $enrollment] = gradeScenario();

    $this->put(route('professor.grades.update', $enrollment), [
        'final_grade' => 9.0,
    ])->assertRedirect(route('login'));
});
