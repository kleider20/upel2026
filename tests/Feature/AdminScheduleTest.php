<?php

use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Models\Admission;
use App\Models\Career;
use App\Models\ProfessorProfile;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Support\ScheduleCalendar;
use App\Support\StudentSchedulePdf;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('schedule time slots include minutes for whole-hour times', function () {
    expect(ScheduleCalendar::timeSlots([
        ['starts_at' => '08:00', 'ends_at' => '10:00'],
        ['starts_at' => '11:00', 'ends_at' => '14:30'],
        ['starts_at' => '11:00', 'ends_at' => '15:00'],
        ['starts_at' => '15:00', 'ends_at' => '17:00'],
    ]))->toBe([
        '1.- 8:00 am - 10:00 am',
        '2.- 11:00 am - 2:30 pm',
        '3.- 11:00 am - 3:00 pm',
        '4.- 3:00 pm - 5:00 pm',
    ]);
});

test('schedule pdf abbreviates month names only when the month cell is too narrow', function () {
    $weeks = [];

    foreach (array_merge(
        array_fill(0, 11, 'Enero'),
        ['Diciembre'],
        array_fill(0, 12, 'Febrero'),
    ) as $index => $month) {
        $weeks[] = [
            'week' => $index + 1,
            'month' => $month,
            'tone' => mb_strtolower($month),
            'day' => (string) ($index + 1),
            'highlight' => null,
        ];
    }

    $narrowPdf = StudentSchedulePdf::make([
        'title' => 'Horario de prueba',
        'career' => 'Educación Primaria',
        'period' => 'I',
        'cohort' => '2025-II',
        'weeks' => $weeks,
        'subjects' => [],
        'distance_subjects' => [],
        'time_slots' => [],
        'distance_schedule' => null,
        'distance_time' => null,
    ]);
    $widePdf = StudentSchedulePdf::make([
        'title' => 'Horario de prueba',
        'career' => 'Educación Primaria',
        'period' => 'I',
        'cohort' => '2025-II',
        'weeks' => [[
            'week' => 1,
            'month' => 'Diciembre',
            'tone' => 'diciembre',
            'day' => '06',
            'highlight' => null,
        ]],
        'subjects' => [],
        'distance_subjects' => [],
        'time_slots' => [],
        'distance_schedule' => null,
        'distance_time' => null,
    ]);

    expect($narrowPdf)->toContain('(Dic) Tj ET')
        ->and($narrowPdf)->not->toContain('(Diciembre) Tj ET')
        ->and($widePdf)->toContain('(Diciembre) Tj ET');
});

/**
 * Usuario administrativo con permisos sobre horarios.
 */
function scheduleManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

/**
 * Materia del horario con fecha y hora válidas por defecto.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function scheduleSubject(int $position, int $subjectId, array $overrides = []): array
{
    $subject = [
        'position' => $position,
        'subject_id' => $subjectId,
        'dates' => ['2025-08-02'],
        'starts_at' => '08:00',
        'ends_at' => '12:00',
        ...$overrides,
    ];

    $subject['date_times'] ??= array_fill_keys(
        $subject['dates'],
        [
            'starts_at' => $subject['starts_at'],
            'ends_at' => $subject['ends_at'],
        ],
    );

    return $subject;
}

/**
 * Datos base para publicar un horario sabatino de 16 sábados.
 *
 * @param  array<int, array<string, mixed>>  $subjects
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function schedulePayload(int $careerId, array $subjects, array $overrides = []): array
{
    return [
        'career_id' => $careerId,
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
        'starts_on' => '2025-08-02',
        'ends_on' => '2025-11-15',
        'subjects' => $subjects,
        ...$overrides,
    ];
}

/**
 * Sábados entre dos fechas, para marcar todas las columnas del horario.
 *
 * @return array<int, string>
 */
function saturdayRange(string $startsOn, string $endsOn): array
{
    $dates = [];
    $date = Carbon::parse($startsOn);

    while ($date->toDateString() <= $endsOn) {
        $dates[] = $date->toDateString();
        $date->addWeek();
    }

    return $dates;
}

test('guests are redirected to the admin login page', function () {
    $this->get(route('admin.schedules.index'))
        ->assertRedirect(route('admin.login'));
});

test('financial staff cannot access schedule management', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.schedules.index'))
        ->assertForbidden();
});

test('academic managers can list schedules with filters and stats', function () {
    $primary = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
    ]);
    Schedule::factory()->for($primary)->create([
        'period' => 1,
        'cohort' => '2025-II',
    ]);
    Schedule::factory()->create([
        'career_id' => Career::factory()->create(['name' => 'Educación Especial'])->id,
        'cohort' => '2026-I',
    ]);

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.index', ['search' => 'Primaria']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/index')
            ->has('schedules.data', 1)
            ->where('schedules.data.0.career', 'Educación Primaria')
            ->where('schedules.data.0.period_label', 'I')
            ->where('schedules.data.0.cohort', '2025-II')
            ->has('schedules.data.0.edit_url')
            ->where('filters.search', 'Primaria')
            ->has('careers')
            ->has('stats', 4)
            ->where('can_manage', true)
        );

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.index', ['career_id' => $primary->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/index')
            ->has('schedules.data', 1)
            ->where('schedules.data.0.cohort', '2025-II')
            ->where('filters.career_id', $primary->id)
        );
});

it('notifies only active students matching the published career, period, modality and study schedule', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
    ]);

    $createStudent = static function (
        Career $studentCareer,
        string $modality = 'mixta',
        string $studySchedule = 'sabatino',
        int $semester = 1,
        string $profileStatus = 'activo',
    ): User {
        $user = User::factory()->create(['must_change_password' => false]);
        $user->assignRole(Role::Estudiante->value);

        StudentProfile::factory()->for($studentCareer)->for($user)->create([
            'current_semester' => $semester,
            'status' => $profileStatus,
        ]);

        Admission::factory()->create([
            'status' => AdmissionStatus::Convertida->value,
            'converted_user_id' => $user->id,
            'career_id' => $studentCareer->id,
            'modality' => $modality,
            'schedule' => $studySchedule,
        ]);

        return $user;
    };

    $matchingStudent = $createStudent($career);
    $wrongModalityStudent = $createStudent($career, 'presencial');
    $wrongStudyScheduleStudent = $createStudent($career, 'mixta', 'lunes_viernes');
    $wrongSemesterStudent = $createStudent($career, 'mixta', 'sabatino', 2);
    $inactiveStudent = $createStudent($career, 'mixta', 'sabatino', 1, 'suspendido');
    $otherCareerStudent = $createStudent(Career::factory()->create());

    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload(
            $career->id,
            [scheduleSubject(1, $subject->id)],
        ))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($matchingStudent->notifications()->count())->toBe(1)
        ->and($matchingStudent->notifications()->first()->data)->toMatchArray([
            'title' => 'Horario de clases',
            'message' => 'Se ha publicado tu horario de clases.',
            'destination' => 'horario',
        ]);

    expect($wrongModalityStudent->notifications()->count())->toBe(0)
        ->and($wrongStudyScheduleStudent->notifications()->count())->toBe(0)
        ->and($wrongSemesterStudent->notifications()->count())->toBe(0)
        ->and($inactiveStudent->notifications()->count())->toBe(0)
        ->and($otherCareerStudent->notifications()->count())->toBe(0);

    $schedule = Schedule::query()->firstOrFail();

    $this->actingAs(scheduleManager())
        ->put(route('admin.schedules.update', $schedule), schedulePayload(
            $career->id,
            [scheduleSubject(1, $subject->id)],
        ))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($matchingStudent->notifications()->count())->toBe(2);
});

it('allows publishing the same cohort for a different modality and study schedule', function () {
    $career = Career::factory()->create();
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    $manager = scheduleManager();
    $firstSchedule = schedulePayload($career->id, [
        scheduleSubject(1, $subject->id),
    ]);
    $secondSchedule = schedulePayload($career->id, [
        scheduleSubject(1, $subject->id, [
            'dates' => ['2025-08-04'],
            'starts_at' => '08:00',
            'ends_at' => '12:00',
        ]),
    ], [
        'study_schedule' => 'lunes_viernes',
        'modality' => 'presencial',
    ]);

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), $firstSchedule)
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), $secondSchedule)
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseCount('schedules', 2);
});

it('rejects a modality that is not offered for the selected study schedule', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $career->offerings()->create([
        'modality' => 'mixta',
        'schedule' => 'sabatino',
        'shift' => 'diurno',
        'is_active' => true,
    ]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload(
            $career->id,
            [scheduleSubject(1, $subject->id)],
            ['modality' => 'presencial'],
        ))
        ->assertSessionHasErrors([
            'modality' => 'La combinación de horario y modalidad no está activa en la oferta de la carrera.',
        ]);

    $this->assertDatabaseCount('schedules', 0);
});

test('academic managers can create a schedule with the official template', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
        'modality' => 'mixta',
    ]);
    $career->offerings()->create([
        'modality' => 'mixta',
        'schedule' => 'sabatino',
        'shift' => 'diurno',
        'is_active' => true,
    ]);
    $professor = User::factory()->create(['name' => 'Ana Pérez']);
    $professorProfile = ProfessorProfile::factory()->for($professor)->create();
    $subjects = Subject::factory()->count(2)->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);
    $professorProfile->subjects()->attach($subjects->first());

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subjects->first()->id, [
                'professor_id' => $professor->id,
                'dates' => ['2025-08-02', '2025-08-09'],
                'starts_at' => '08:00',
                'ends_at' => '12:00',
            ]),
            scheduleSubject(3, $subjects->last()->id),
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $schedule = Schedule::query()->with('subjects')->first();

    expect($schedule)->not->toBeNull()
        ->and($schedule->career_id)->toBe($career->id)
        ->and($schedule->period)->toBe(1)
        ->and($schedule->cohort)->toBe('2025-II')
        ->and($schedule->study_schedule)->toBe('sabatino')
        ->and($schedule->starts_on?->toDateString())->toBe('2025-08-02')
        ->and($schedule->ends_on?->toDateString())->toBe('2025-11-15')
        ->and($schedule->subjects)->toHaveCount(2)
        ->and((int) $schedule->subjects[0]->pivot->position)->toBe(1)
        ->and((int) $schedule->subjects[0]->pivot->professor_id)->toBe($professor->id)
        ->and(json_decode((string) $schedule->subjects[0]->pivot->dates, true))
        ->toBe(['2025-08-02', '2025-08-09'])
        ->and($schedule->subjects[0]->pivot->starts_at)->toContain('08:00')
        ->and($schedule->subjects[0]->pivot->ends_at)->toContain('12:00')
        ->and((int) $schedule->subjects[1]->pivot->position)->toBe(3)
        ->and($schedule->subjects[1]->pivot->professor_id)->toBeNull();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->where('schedule.career', 'Educación Primaria')
            ->where('schedule.period', 'I')
            ->where('schedule.cohort', '2025-II')
            ->where('schedule.title', 'HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO 2025-II')
            ->where('schedule.schedule_label', 'Sabatino')
            ->has('schedule.weeks', 2)
            ->has('schedule.subjects', 2)
            ->has('schedule.distance_subjects', 2)
            ->where('schedule.subjects.0.code', $subjects->first()->code)
            ->where('schedule.subjects.0.name', $subjects->first()->name)
            ->where('schedule.subjects.0.teacher', 'Ana Pérez')
            ->where('schedule.subjects.0.hours.0', '8:00 am - 12:00 pm')
            ->where('schedule.subjects.0.hours.1', '8:00 am - 12:00 pm')
            ->where('schedule.subjects.0.pdf_hours.0', '8-12')
            ->where('schedule.subjects.1.code', $subjects->last()->code)
            ->where('schedule.subjects.1.teacher', 'Amada Prim')
            ->where('meta.period_label', 'I')
            ->where('meta.schedule_label', 'Sabatino')
            ->where('can_manage', true)
        );
});

test('schedule form lists only registered professors assigned to each subject', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create([
        'name' => 'Desarrollo de Procesos Cognitivos',
        'semester' => 1,
    ]);
    $professor = User::factory()->create(['name' => 'Amada Prim']);
    $professorProfile = ProfessorProfile::factory()->for($professor)->create();
    $professorProfile->subjects()->attach($subject);
    $unregisteredProfessor = User::factory()->create(['name' => 'Docente sin perfil']);
    $subject->professors()->attach($unregisteredProfessor);

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/form')
            ->where('subjects.0.name', 'Desarrollo de Procesos Cognitivos')
            ->has('subjects.0.professors', 1)
            ->where('subjects.0.professors.0.name', 'Amada Prim')
            ->where('subjects.0.professors.0.id', $professor->id)
        );
});

test('academic managers can edit a published schedule and its date-specific times', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);
    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
        'starts_on' => '2025-08-02',
        'ends_on' => '2025-11-15',
    ]);
    $schedule->subjects()->attach($subject->id, [
        'position' => 1,
        'dates' => json_encode(['2025-08-02']),
        'date_times' => json_encode([
            '2025-08-02' => ['starts_at' => '09:00', 'ends_at' => '12:00'],
        ]),
        'starts_at' => '09:00',
        'ends_at' => '12:00',
    ]);

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.edit', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/form')
            ->where('schedule.id', $schedule->id)
            ->where('schedule.cohort', '2025-II')
            ->where('schedule.subjects.0.position', 1)
            ->where('schedule.subjects.0.dates', ['2025-08-02'])
            ->where('schedule.subjects.0.date_times.2025-08-02.starts_at', '09:00')
        );

    $this->actingAs(scheduleManager())
        ->put(route('admin.schedules.update', $schedule), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'dates' => ['2025-08-09'],
                'date_times' => [
                    '2025-08-09' => ['starts_at' => '14:00', 'ends_at' => '16:00'],
                ],
            ]),
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.schedules.show', $schedule));

    $schedule->refresh()->load('subjects');

    expect($schedule->cohort)->toBe('2025-II')
        ->and($schedule->subjects)->toHaveCount(1)
        ->and(json_decode((string) $schedule->subjects[0]->pivot->dates, true))
        ->toBe(['2025-08-09'])
        ->and(json_decode((string) $schedule->subjects[0]->pivot->date_times, true))
        ->toBe([
            '2025-08-09' => ['starts_at' => '14:00', 'ends_at' => '16:00'],
        ]);

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('schedule.weeks.0.day', '09')
            ->where('schedule.subjects.0.hours', ['2:00 pm - 4:00 pm'])
        );
});

test('schedule managers cannot update a schedule to another schedules cohort', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
    ]);
    Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2026-I',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
    ]);

    $this->actingAs(scheduleManager())
        ->put(route('admin.schedules.update', $schedule), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id),
        ], [
            'cohort' => '2026-I',
        ]))
        ->assertSessionHasErrors('cohort');

    expect($schedule->refresh()->cohort)->toBe('2025-II');
});

test('staff without schedule management permission cannot edit a published schedule', function () {
    $schedule = Schedule::factory()->create();
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.schedules.edit', $schedule))
        ->assertForbidden();
});

test('sabatino schedules generate one column per saturday inside the range', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);
    $subject = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'dates' => ['2025-08-02', '2025-08-16'],
                'starts_at' => '13:00',
                'ends_at' => '17:00',
            ]),
        ], [
            'starts_on' => '2025-08-02',
            'ends_on' => '2025-08-30',
        ]))
        ->assertRedirect();

    $schedule = Schedule::query()->firstOrFail();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->has('schedule.weeks', 2)
            ->where('schedule.weeks.0.day', '02')
            ->where('schedule.weeks.0.month', 'Agosto')
            ->where('schedule.weeks.1.day', '16')
            ->where('schedule.subjects.0.hours', [
                '1:00 pm - 5:00 pm',
                '1:00 pm - 5:00 pm',
            ])
            ->where('schedule.subjects.0.pdf_hours', [
                '1-5',
                '1-5',
            ])
            ->where('schedule.time_slots', ['1.- 1:00 pm - 5:00 pm'])
        );
});

test('weekday schedules group class dates by week and show the selected days', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);
    $subjects = Subject::factory()->count(2)->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subjects->first()->id, [
                'dates' => ['2025-08-04', '2025-08-06'],
                'starts_at' => '09:00',
                'ends_at' => '11:00',
                'date_times' => [
                    '2025-08-04' => ['starts_at' => '09:00', 'ends_at' => '11:00'],
                    '2025-08-06' => ['starts_at' => '13:00', 'ends_at' => '15:00'],
                ],
            ]),
            scheduleSubject(2, $subjects->last()->id, [
                'dates' => ['2025-08-11', '2025-08-12', '2025-08-13', '2025-08-14', '2025-08-15'],
                'starts_at' => '13:00',
                'ends_at' => '17:00',
            ]),
        ], [
            'study_schedule' => 'lunes_viernes',
            'starts_on' => '2025-08-04',
            'ends_on' => '2025-08-15',
        ]))
        ->assertRedirect();

    $schedule = Schedule::query()->firstOrFail();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->where('schedule.schedule_label', 'Lunes a viernes')
            ->has('schedule.weeks', 2)
            ->where('schedule.weeks.0.day', '04, 06')
            ->where('schedule.weeks.0.dates', [
                '2025-08-04',
                '2025-08-06',
            ])
            ->where('schedule.weeks.1.day', '11, 12, 13, 14, 15')
            ->where('schedule.subjects.0.hours', [
                'Lun · 9:00 am - 11:00 am / Mié · 1:00 pm - 3:00 pm',
                null,
            ])
            ->where('schedule.subjects.0.pdf_hours', ['L 9-11 / X 1-3', null])
            ->where('schedule.subjects.1.hours', [
                null,
                'Lun a Vie · 1:00 pm - 5:00 pm',
            ])
            ->where('schedule.subjects.1.pdf_hours', [null, 'L-V 1-5'])
            ->where('schedule.time_slots', [
                '1.- 9:00 am - 11:00 am',
                '2.- 1:00 pm - 3:00 pm',
                '3.- 1:00 pm - 5:00 pm',
            ])
        );
});

test('schedule class dates must belong to the chosen range and schedule type', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    $manager = scheduleManager();

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, ['dates' => ['2025-07-26']]),
        ]))
        ->assertSessionHasErrors('subjects.0.dates');

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, ['dates' => ['2025-08-04']]),
        ]))
        ->assertSessionHasErrors('subjects.0.dates');

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id),
        ], [
            'starts_on' => '2025-08-04',
            'ends_on' => '2025-08-08',
        ]))
        ->assertSessionHasErrors('starts_on');

    expect(Schedule::query()->count())->toBe(0);
});

test('schedule class times must be ordered', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'date_times' => [
                    '2025-08-02' => ['starts_at' => '12:00', 'ends_at' => '08:00'],
                ],
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.date_times.2025-08-02.ends_at');

    expect(Schedule::query()->count())->toBe(0);
});

test('schedule times must be defined for exactly the selected dates', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'dates' => ['2025-08-02', '2025-08-09'],
                'date_times' => [
                    '2025-08-02' => ['starts_at' => '08:00', 'ends_at' => '12:00'],
                ],
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.date_times');

    expect(Schedule::query()->count())->toBe(0);
});

test('schedule validation rejects invalid cohorts and periods outside the career', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $manager = scheduleManager();

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id),
        ], [
            'cohort' => '2025/II',
        ]))
        ->assertSessionHasErrors('cohort');

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id),
        ], [
            'period' => 9,
        ]))
        ->assertSessionHasErrors('period');

    expect(Schedule::query()->count())->toBe(0);
});

test('schedule subjects must belong to the selected career and period', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $otherCareer = Career::factory()->create(['duration_semesters' => 8]);
    $otherPeriodSubject = Subject::factory()->for($career)->create(['semester' => 2]);
    $otherCareerSubject = Subject::factory()->for($otherCareer)->create(['semester' => 1]);

    $manager = scheduleManager();

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $otherPeriodSubject->id),
        ]))
        ->assertSessionHasErrors('subjects.0.subject_id');

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $otherCareerSubject->id),
        ]))
        ->assertSessionHasErrors('subjects.0.subject_id');

    expect(Schedule::query()->count())->toBe(0);
});

test('schedule subjects cannot repeat the same subject or position', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subjects = Subject::factory()->count(2)->for($career)->create(['semester' => 1]);
    $manager = scheduleManager();

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subjects->first()->id),
            scheduleSubject(2, $subjects->first()->id, ['dates' => ['2025-08-09']]),
        ]))
        ->assertSessionHasErrors('subjects.1.subject_id');

    $this->actingAs($manager)
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subjects->first()->id),
            scheduleSubject(1, $subjects->last()->id, ['dates' => ['2025-08-09']]),
        ]))
        ->assertSessionHasErrors('subjects.1.position');

    expect(Schedule::query()->count())->toBe(0);
});

test('online subjects are published as virtual in both grids', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);
    $online = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'online',
    ]);

    $dates = saturdayRange('2025-08-02', '2025-11-15');

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $online->id, ['dates' => $dates]),
        ], [
            'cohort' => '2026-I',
        ]))
        ->assertRedirect();

    $schedule = Schedule::query()->firstOrFail();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->where('schedule.subjects.0.code', $online->code)
            ->where('schedule.subjects.0.hours', array_fill(0, 16, 'Virtual'))
            ->where('schedule.distance_subjects.0.hours', array_fill(0, 16, 'Virtual'))
        );
});

test('presencial subjects never inherit Virtual from the template slot', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);
    $subject = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);

    $dates = saturdayRange('2025-08-02', '2025-11-15');

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(7, $subject->id, ['dates' => $dates]),
        ], [
            'cohort' => '2026-I',
        ]))
        ->assertRedirect();

    $schedule = Schedule::query()->firstOrFail();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->where('schedule.subjects.0.code', $subject->code)
            ->where('schedule.subjects.0.hours', array_fill(0, 16, '8:00 am - 12:00 pm'))
            ->where('schedule.distance_subjects.0.hours', array_fill(0, 16, null))
        );
});

test('the selected professor must have an assignment to the subject', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    $professor = User::factory()->create();

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'professor_id' => $professor->id,
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.professor_id');

    expect(Schedule::query()->count())->toBe(0);
});

test('a professor without a profile cannot be selected even when linked to a subject', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    $professor = User::factory()->create();
    $subject->professors()->attach($professor);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'professor_id' => $professor->id,
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.professor_id');

    expect(Schedule::query()->count())->toBe(0);
});

test('template teachers can be assigned to a published schedule', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'duration_semesters' => 8,
    ]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'teacher_name' => 'Edilia Díaz',
            ]),
        ], [
            'cohort' => '2026-I',
        ]))
        ->assertRedirect();

    $schedule = Schedule::query()->with('subjects')->firstOrFail();

    expect($schedule->subjects[0]->pivot->teacher_name)->toBe('Edilia Díaz')
        ->and($schedule->subjects[0]->pivot->professor_id)->toBeNull();

    $this->actingAs(scheduleManager())
        ->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/show')
            ->where('schedule.subjects.0.teacher', 'Edilia Díaz')
            ->where('schedule.distance_subjects.0.teacher', 'Edilia Díaz')
        );
});

test('the chosen teacher must belong to the official template', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id, [
                'teacher_name' => 'Docente Inexistente',
            ]),
        ]))
        ->assertSessionHasErrors('subjects.0.teacher_name');

    expect(Schedule::query()->count())->toBe(0);
});

test('the same career, period and cohort cannot be published twice', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create(['semester' => 1]);
    Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
    ]);

    $this->actingAs(scheduleManager())
        ->post(route('admin.schedules.store'), schedulePayload($career->id, [
            scheduleSubject(1, $subject->id),
        ]))
        ->assertSessionHasErrors('cohort');

    expect(Schedule::query()->count())->toBe(1);
});

test('the published schedule pdf excludes dates without assigned hours except range boundaries', function () {
    $career = Career::factory()->create(['duration_semesters' => 8]);
    $subject = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'presencial',
    ]);
    $onlineSubject = Subject::factory()->for($career)->create([
        'semester' => 1,
        'modality' => 'online',
    ]);
    $dates = saturdayRange('2025-11-29', '2026-01-10');
    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'starts_on' => '2025-11-29',
        'ends_on' => '2026-01-10',
    ]);
    $schedule->subjects()->attach($subject->id, [
        'position' => 1,
        'dates' => json_encode($dates),
        'date_times' => json_encode([
            '2025-11-29' => ['starts_at' => '', 'ends_at' => ''],
            '2025-12-06' => ['starts_at' => '11:30', 'ends_at' => '14:30'],
            '2025-12-13' => ['starts_at' => '', 'ends_at' => ''],
            '2025-12-20' => ['starts_at' => '', 'ends_at' => ''],
            '2025-12-27' => ['starts_at' => '', 'ends_at' => ''],
            '2026-01-03' => ['starts_at' => '', 'ends_at' => ''],
            '2026-01-10' => ['starts_at' => '', 'ends_at' => ''],
        ]),
        'starts_at' => '08:00',
        'ends_at' => '12:00',
    ]);
    $onlineDateTimes = array_fill_keys(
        $dates,
        ['starts_at' => '19:00', 'ends_at' => '21:00'],
    );
    $schedule->subjects()->attach($onlineSubject->id, [
        'position' => 2,
        'dates' => json_encode($dates),
        'date_times' => json_encode($onlineDateTimes),
        'starts_at' => '19:00',
        'ends_at' => '21:00',
    ]);
    $manager = scheduleManager();

    $response = $this->actingAs($manager)
        ->get(route('admin.schedules.pdf', $schedule));

    $response
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    $pdfContent = $response->getContent();

    expect($pdfContent)->toContain('(29) Tj ET')
        ->and($pdfContent)->toContain('(06) Tj ET')
        ->and($pdfContent)->toContain('(10) Tj ET')
        ->and($pdfContent)->toContain('(11) Tj ET')
        ->and($pdfContent)->not->toContain('(13) Tj ET')
        ->and($pdfContent)->not->toContain('(20) Tj ET')
        ->and($pdfContent)->not->toContain('(27) Tj ET')
        ->and($pdfContent)->not->toContain('(03) Tj ET');

    expect($schedule->toScheduleArray()['weeks'])->toHaveCount(7);
});

test('academic managers can download and delete a published schedule', function () {
    $schedule = Schedule::factory()->create([
        'period' => 2,
        'cohort' => '2025-I',
    ]);
    $manager = scheduleManager();

    $this->actingAs($manager)
        ->get(route('admin.schedules.pdf', $schedule))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    $this->actingAs($manager)
        ->delete(route('admin.schedules.destroy', $schedule))
        ->assertRedirect(route('admin.schedules.index'));

    expect(Schedule::query()->count())->toBe(0);
});

test('the student schedule prefers the schedule published by the administration', function () {
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'duration_semesters' => 8,
    ]);
    Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2026-I',
        'study_schedule' => 'sabatino',
        'modality' => 'mixta',
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
        'modality' => 'mixta',
        'schedule' => 'sabatino',
    ]);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard/Index')
            ->where('schedule.cohort', '2026-I')
            ->where('schedule.period', 'I')
            ->where('schedule.career', 'Educación Primaria')
            ->where('schedule.title', 'HORARIOS DE ACTIVIDADES PRESENCIALES DEL PERÍODO ACADÉMICO 2026-I')
            ->has('schedule.weeks', 16)
            ->where('schedule.schedule_label', 'Sabatino')
        );
});
