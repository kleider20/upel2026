<?php

use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\AdmissionWindowSetting;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Escenario base: un estudiante de primer semestre con el período 2025-II
 * cursado y el 2026-II activo como siguiente período.
 *
 * @return array{user: User, career: Career, previous: AcademicPeriod, next: AcademicPeriod, subjects: array<string, Subject>}
 */
function enrollmentScenario(): array
{
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);

    $previous = AcademicPeriod::factory()->create([
        'name' => '2025-II',
        'starts_at' => '2025-09-15',
        'ends_at' => '2026-01-31',
        'is_active' => false,
    ]);

    $next = AcademicPeriod::factory()->create([
        'name' => '2026-II',
        'starts_at' => '2026-09-01',
        'ends_at' => '2027-01-31',
        'is_active' => true,
    ]);

    $user = User::factory()->create(['must_change_password' => false]);
    $user->assignRole(Role::Estudiante->value);

    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'career_id' => $career->id,
        'student_code' => 'EST-2027-010',
        'current_semester' => 1,
        'cohort' => '2025-II',
    ]);

    $subjects = [
        'first' => Subject::factory()->create([
            'career_id' => $career->id,
            'code' => 'EDPRI-001',
            'semester' => 1,
            'credits' => 4,
        ]),
        'a' => Subject::factory()->create([
            'career_id' => $career->id,
            'code' => 'EDPRI-007',
            'semester' => 2,
            'credits' => 4,
        ]),
        'b' => Subject::factory()->create([
            'career_id' => $career->id,
            'code' => 'EDPRI-008',
            'semester' => 2,
            'credits' => 4,
        ]),
        'c' => Subject::factory()->create([
            'career_id' => $career->id,
            'code' => 'EDPRI-009',
            'semester' => 2,
            'credits' => 8,
        ]),
    ];

    return compact('user', 'career', 'previous', 'next', 'subjects');
}

/**
 * Habilita la ventana de inscripciones sin depender de la fecha del sistema.
 */
function openEnrollmentWindow(): AdmissionWindowSetting
{
    return AdmissionWindowSetting::query()->create([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-12-15',
        'mode' => AdmissionWindowSetting::MODE_OPEN,
    ]);
}

test('la página de inscripción expone las materias y las UC del siguiente período', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'subjects' => $subjects] = enrollmentScenario();

    Enrollment::factory()->graded(8.5)->create([
        'student_id' => $user->id,
        'subject_id' => $subjects['first']->id,
        'academic_period_id' => $previous->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/inscripciones/index')
            ->where('enrollment.window.is_open', true)
            ->where('enrollment.period.name', '2026-II')
            ->where('enrollment.semester', 2)
            ->where('enrollment.credits.budget', 16)
            ->where('enrollment.credits.required', 0)
            ->where('enrollment.credits.selected', 16)
            ->where('enrollment.submitted', false)
            ->has('enrollment.subjects', 3)
            ->where('enrollment.subjects.0.is_locked', false)
            ->where('enrollment.subjects.0.is_selected', true)
            ->where('enrollment.subjects.2.is_selected', true)
        );
});

test('el estudiante inscribe las materias del período y se genera la planilla', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'next' => $next, 'subjects' => $subjects] = enrollmentScenario();

    Enrollment::factory()->graded(8.5)->create([
        'student_id' => $user->id,
        'subject_id' => $subjects['first']->id,
        'academic_period_id' => $previous->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [
                $subjects['a']->id,
                $subjects['b']->id,
                $subjects['c']->id,
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(
        Enrollment::query()
            ->where('student_id', $user->id)
            ->where('academic_period_id', $next->id)
            ->where('status', 'cursando')
            ->count(),
    )->toBe(3);

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.submitted', true)
            ->has('enrollment.sheet.rows', 3)
            ->where('enrollment.sheet.total_credits', 16)
            ->where('enrollment.sheet.period', '2026-II')
        );

    $response = $this->actingAs($user)->get(route('student.enrollment.sheet'));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');

    $pdf = (string) $response->getContent();

    expect(substr($pdf, 0, 4))->toBe('%PDF');
    expect($pdf)->toContain('ASESORADOS');
    expect($pdf)->not->toContain('DOCENTE');
});

test('las materias aplazadas consumen UC y no se pueden quitar', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'next' => $next, 'subjects' => $subjects] = enrollmentScenario();

    Enrollment::factory()->graded(3.0)->create([
        'student_id' => $user->id,
        'subject_id' => $subjects['first']->id,
        'academic_period_id' => $previous->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.credits.required', 4)
            ->where('enrollment.credits.selected', 12)
            ->where('enrollment.subjects.0.kind', 'failed')
            ->where('enrollment.subjects.0.is_locked', true)
            ->where('enrollment.subjects.0.is_selected', true)
            ->where('enrollment.subjects.3.is_selected', false)
        );

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['a']->id, $subjects['b']->id],
        ])
        ->assertSessionHasErrors('subjects');

    expect(Enrollment::query()->where('academic_period_id', $next->id)->count())->toBe(0);

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['first']->id, $subjects['c']->id],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Enrollment::query()->where('academic_period_id', $next->id)->count())->toBe(2);

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [
                $subjects['first']->id,
                $subjects['a']->id,
                $subjects['b']->id,
                $subjects['c']->id,
            ],
        ])
        ->assertSessionHasErrors('subjects');
});

test('desmarcar una materia elimina su inscripción mientras no tenga notas', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'next' => $next, 'subjects' => $subjects] = enrollmentScenario();

    Enrollment::factory()->graded(8.5)->create([
        'student_id' => $user->id,
        'subject_id' => $subjects['first']->id,
        'academic_period_id' => $previous->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [
                $subjects['a']->id,
                $subjects['b']->id,
                $subjects['c']->id,
            ],
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['a']->id],
        ])
        ->assertRedirect();

    $remaining = Enrollment::query()
        ->where('student_id', $user->id)
        ->where('academic_period_id', $next->id)
        ->pluck('subject_id')
        ->all();

    expect($remaining)->toBe([$subjects['a']->id]);
});

test('la ventana cerrada impide registrar la inscripción', function () {
    AdmissionWindowSetting::query()->create([
        'opens_on' => '2026-11-01',
        'closes_on' => '2026-12-15',
        'mode' => AdmissionWindowSetting::MODE_CLOSED,
    ]);

    ['user' => $user, 'subjects' => $subjects] = enrollmentScenario();

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['a']->id],
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.window.is_open', false)
            ->where('enrollment.window.reason', 'manual')
        );

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('studentEnrollment.is_open', false)
        );
});

test('una materia reprobada dos veces queda registrada y se puede cursar por tercera vez', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'subjects' => $subjects] = enrollmentScenario();

    $older = AcademicPeriod::factory()->create([
        'name' => '2024-II',
        'starts_at' => '2024-09-01',
        'ends_at' => '2025-01-31',
        'is_active' => false,
    ]);

    foreach ([$older, $previous] as $period) {
        Enrollment::factory()->graded(3.0)->create([
            'student_id' => $user->id,
            'subject_id' => $subjects['first']->id,
            'academic_period_id' => $period->id,
        ]);
    }

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.suspension.is_suspended', false)
            ->where('enrollment.subjects.0.code', 'EDPRI-001')
            ->where('enrollment.subjects.0.attempts', 2)
            ->where('enrollment.subjects.0.is_locked', true)
        );

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['first']->id, $subjects['c']->id],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('subjects', function ($items): bool {
                $subject = collect($items)->firstWhere('code', 'EDPRI-001');

                return $subject !== null
                    && $subject['attempts'] === 2
                    && $subject['status'] === 'reprobado';
            })
        );
});

test('la tercera reprobación suspende las inscripciones del estudiante', function () {
    openEnrollmentWindow();

    ['user' => $user, 'previous' => $previous, 'next' => $next, 'subjects' => $subjects] = enrollmentScenario();

    $older = AcademicPeriod::factory()->create([
        'name' => '2024-II',
        'starts_at' => '2024-09-01',
        'ends_at' => '2025-01-31',
        'is_active' => false,
    ]);

    $middle = AcademicPeriod::factory()->create([
        'name' => '2025-I',
        'starts_at' => '2025-02-01',
        'ends_at' => '2025-07-31',
        'is_active' => false,
    ]);

    foreach ([$older, $middle, $previous] as $period) {
        Enrollment::factory()->graded(3.0)->create([
            'student_id' => $user->id,
            'subject_id' => $subjects['first']->id,
            'academic_period_id' => $period->id,
        ]);
    }

    $this->actingAs($user)
        ->get(route('student.enrollment.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.suspension.is_suspended', true)
            ->where('enrollment.suspension.subjects.0', $subjects['first']->name)
            ->where('enrollment.subjects.0.attempts', 3)
            ->where('enrollment.sheet', null)
        );

    $this->actingAs($user)
        ->post(route('student.enrollment.store'), [
            'subjects' => [$subjects['a']->id],
        ])
        ->assertSessionHasErrors('subjects');

    $message = (string) session('errors')->first('subjects');

    expect($message)->toContain($subjects['first']->name);
    expect($message)->toContain('control de estudios');
    expect(Enrollment::query()->where('academic_period_id', $next->id)->count())->toBe(0);
});
