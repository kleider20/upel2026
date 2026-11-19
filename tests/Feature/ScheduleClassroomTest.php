<?php

use App\Enums\Role;
use App\Models\Career;
use App\Models\Classroom;
use App\Models\ProfessorProfile;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** Administrador con permisos de horarios. */
function roomManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

/** Carrera y dos materias del primer período para probar choques. */
function roomScenario(): array
{
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);

    $first = Subject::factory()->for($career)->create([
        'semester' => 1,
        'code' => 'EDPRI-001',
    ]);
    $second = Subject::factory()->for($career)->create([
        'semester' => 1,
        'code' => 'EDPRI-002',
    ]);

    return compact('career', 'first', 'second');
}

/** Docente con perfil y materias asignadas en el banco docente. */
function roomProfessor(array $subjectIds): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::Profesor->value);
    ProfessorProfile::factory()->for($user)->create();
    $user->taughtSubjects()->attach($subjectIds);

    return $user;
}

/**
 * @param  array<int, array<string, mixed>>  $subjects
 * @return array<string, mixed>
 */
function roomPayload(Career $career, array $subjects): array
{
    return [
        'career_id' => $career->id,
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
        'starts_on' => '2025-08-02',
        'ends_on' => '2025-11-15',
        'subjects' => $subjects,
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function roomSubject(int $position, int $subjectId, array $overrides = []): array
{
    $date = '2025-08-02';
    $startsAt = '08:00';
    $endsAt = '12:00';

    return [
        'position' => $position,
        'subject_id' => $subjectId,
        'dates' => [$date],
        'date_times' => [
            $date => [
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ],
        ],
        ...$overrides,
    ];
}

test('el administrador gestiona el catálogo de aulas', function () {
    $manager = roomManager();

    $this->actingAs($manager)
        ->post(route('admin.classrooms.store'), [
            'code' => 'a-201',
            'name' => 'Sala de clases 2',
            'capacity' => 40,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.classrooms.index'))
        ->assertSessionHasNoErrors();

    $classroom = Classroom::query()->firstOrFail();
    expect($classroom->code)->toBe('A-201');

    $this->actingAs($manager)
        ->put(route('admin.classrooms.update', $classroom), [
            'code' => 'A-201',
            'name' => 'Sala de clases 2 (nueva)',
            'capacity' => 45,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($classroom->fresh()->name)->toBe('Sala de clases 2 (nueva)');

    $this->actingAs($manager)
        ->get(route('admin.classrooms.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/classrooms/index')
            ->has('classrooms.data', 1)
            ->where('classrooms.data.0.code', 'A-201')
        );
});

test('el aula asignada se guarda en la materia del horario', function () {
    ['career' => $career, 'first' => $subject] = roomScenario();
    $classroom = Classroom::factory()->create();

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $subject->id, [
                'professor_id' => roomProfessor([$subject->id])->id,
                'classroom_id' => $classroom->id,
            ]),
        ]))
        ->assertSessionHasNoErrors();

    $schedule = Schedule::query()->firstOrFail();

    expect($schedule->subjects->first()->pivot->classroom_id)->toBe($classroom->id);

    $this->actingAs(roomManager())
        ->get(route('admin.schedules.edit', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('schedule.subjects.0.classroom_id', (string) $classroom->id)
            ->has('classrooms')
        );
});

test('un docente no puede impartir dos materias a la misma hora', function () {
    ['career' => $career, 'first' => $first, 'second' => $second] = roomScenario();
    $professor = roomProfessor([$first->id, $second->id]);

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $first->id, ['professor_id' => $professor->id]),
            roomSubject(2, $second->id, ['professor_id' => $professor->id]),
        ]))
        ->assertSessionHasErrors('subjects.0.dates');

    expect(Schedule::query()->count())->toBe(0);
});

test('un aula no puede tener dos materias a la misma hora', function () {
    ['career' => $career, 'first' => $first, 'second' => $second] = roomScenario();
    $classroom = Classroom::factory()->create();
    $firstProfessor = roomProfessor([$first->id]);
    $secondProfessor = roomProfessor([$second->id]);

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $first->id, [
                'professor_id' => $firstProfessor->id,
                'classroom_id' => $classroom->id,
            ]),
            roomSubject(2, $second->id, [
                'professor_id' => $secondProfessor->id,
                'classroom_id' => $classroom->id,
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.dates');
});

test('un docente puede impartir materias en horarios distintos', function () {
    ['career' => $career, 'first' => $first, 'second' => $second] = roomScenario();
    $professor = roomProfessor([$first->id, $second->id]);

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $first->id, ['professor_id' => $professor->id]),
            roomSubject(2, $second->id, [
                'professor_id' => $professor->id,
                'dates' => ['2025-08-09'],
                'date_times' => ['2025-08-09' => ['starts_at' => '08:00', 'ends_at' => '12:00']],
            ]),
        ]))
        ->assertSessionHasNoErrors();

    expect(Schedule::query()->count())->toBe(1);
});

test('no se puede eliminar un aula asignada a un horario', function () {
    ['career' => $career, 'first' => $subject] = roomScenario();
    $classroom = Classroom::factory()->create();

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $subject->id, [
                'professor_id' => roomProfessor([$subject->id])->id,
                'classroom_id' => $classroom->id,
            ]),
        ]))
        ->assertSessionHasNoErrors();

    $this->actingAs(roomManager())
        ->delete(route('admin.classrooms.destroy', $classroom))
        ->assertStatus(422);

    expect(Classroom::query()->count())->toBe(1);
});

test('el horario se exporta a iCalendar con el aula y la hora', function () {
    ['career' => $career, 'first' => $subject] = roomScenario();
    $classroom = Classroom::factory()->create(['code' => 'LAB-09', 'name' => 'Laboratorio']);

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $subject->id, [
                'professor_id' => roomProfessor([$subject->id])->id,
                'classroom_id' => $classroom->id,
            ]),
        ]))
        ->assertSessionHasNoErrors();

    $schedule = Schedule::query()->firstOrFail();

    $response = $this->actingAs(roomManager())
        ->get(route('admin.schedules.ics', $schedule));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/calendar');

    $ics = (string) $response->getContent();
    expect($ics)->toContain('BEGIN:VCALENDAR')
        ->toContain('BEGIN:VEVENT')
        ->toContain('DTSTART;TZID=America/Caracas:20250802T080000')
        ->toContain('LAB-09')
        ->toContain('END:VCALENDAR');
});

test('el docente ve su horario y puede exportarlo a calendario', function () {
    ['career' => $career, 'first' => $subject] = roomScenario();
    $classroom = Classroom::factory()->create(['code' => 'A-777', 'name' => 'Sala 7']);
    $professor = roomProfessor([$subject->id]);

    $this->actingAs(roomManager())
        ->post(route('admin.schedules.store'), roomPayload($career, [
            roomSubject(1, $subject->id, [
                'professor_id' => $professor->id,
                'classroom_id' => $classroom->id,
            ]),
        ]))
        ->assertSessionHasNoErrors();

    $this->actingAs($professor)
        ->get(route('professor.schedule'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/schedule')
            ->has('schedules', 1)
            ->where('schedules.0.subjects.0.classroom', 'A-777 — Sala 7')
            ->where('schedules.0.subjects.0.sessions.0.date', '2025-08-02')
        );

    $response = $this->actingAs($professor)->get(route('professor.schedule.ics'));
    $response->assertOk();
    expect((string) $response->getContent())->toContain('A-777');
});
