<?php

use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Admission;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanScore;
use App\Models\ProfessorProfile;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Días de clase que el horario asigna a la materia del escenario.
 *
 * @return array<int, string>
 */
function evaluationClassDates(): array
{
    return [
        '2026-03-07',
        '2026-03-14',
        '2026-03-21',
        '2026-03-28',
        '2026-04-04',
        '2026-04-11',
        '2026-04-18',
        '2026-04-25',
        '2026-05-02',
        '2026-05-09',
        '2026-05-16',
        '2026-05-23',
    ];
}

/**
 * Escenario base: carrera, materia, cohorte y docente con cédula.
 *
 * @return array{professor: User, career: Career, subject: Subject, period: AcademicPeriod, schedule: Schedule}
 */
function evaluationPlanScenario(): array
{
    $career = Career::factory()->create([
        'code' => 'EDPRI',
        'name' => 'Educación Primaria',
        'program_type' => 'pregrado',
    ]);

    $subject = Subject::factory()->for($career)->create([
        'code' => 'TIC-101',
        'name' => 'TIC I',
        'modality' => 'presencial',
    ]);

    $period = AcademicPeriod::factory()->create(['name' => '2025-II']);

    $schedule = Schedule::factory()->for($career)->create([
        'period' => 1,
        'cohort' => '2025-II',
        'study_schedule' => 'sabatino',
        'modality' => 'presencial',
    ]);

    $professor = User::factory()->create(['name' => 'Ana Pérez']);
    $professor->assignRole(Role::Profesor->value);

    $schedule->subjects()->attach($subject->id, [
        'position' => 1,
        'professor_id' => $professor->id,
        'dates' => json_encode(evaluationClassDates()),
    ]);

    ProfessorProfile::factory()->create([
        'user_id' => $professor->id,
        'identity_document' => 'V-11.245.830',
    ]);

    return compact('professor', 'career', 'subject', 'period', 'schedule');
}

/**
 * Arma el formulario de creación con las evaluaciones indicadas.
 *
 * @param  array{subject: Subject, period: AcademicPeriod, schedule: Schedule}  $scenario
 * @param  array<int, array<string, mixed>>  $items
 * @return array<string, mixed>
 */
function evaluationPlanPayload(array $scenario, array $items): array
{
    return [
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
        'items' => $items,
    ];
}

/**
 * Cinco evaluaciones del 20 % que completan el plan.
 *
 * @return array<int, array<string, mixed>>
 */
function completeEvaluationItems(): array
{
    return [
        ['title' => 'Taller I', 'content' => 'Unidad I', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
        ['title' => 'Informe de lectura', 'content' => 'Unidad II', 'weight' => 20, 'scheduled_on' => '2026-04-04'],
        ['title' => 'Exposición', 'content' => 'Unidad III', 'weight' => 20, 'scheduled_on' => '2026-04-18'],
        ['title' => 'Trabajo práctico', 'content' => 'Unidad IV', 'weight' => 20, 'scheduled_on' => '2026-05-02'],
        ['title' => 'Prueba escrita final', 'content' => 'Unidad V', 'weight' => 20, 'scheduled_on' => '2026-05-23'],
    ];
}

test('professors see their careers, cohorts and sheet data when creating a plan', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('professor/plans/create')
            ->has('careers', 1)
            ->where('careers.0.code', 'EDPRI')
            ->where('careers.0.program', 'Pregrado')
            ->has('careers.0.cohorts', 1)
            ->where('careers.0.cohorts.0.cohort', '2025-II')
            ->where('careers.0.cohorts.0.study_schedule_label', 'Sabatino')
            ->has('careers.0.subjects', 1)
            ->where('careers.0.subjects.0.course', 'TIC-101 - TIC I')
            ->has('careers.0.cohorts.0.subject_dates', 1)
            ->has('careers.0.cohorts.0.subject_dates.'.$scenario['subject']->id, 12)
            ->where('careers.0.cohorts.0.subject_dates.'.$scenario['subject']->id.'.0.value', '2026-03-07')
            ->where('careers.0.cohorts.0.subject_dates.'.$scenario['subject']->id.'.0.label', 'Sáb 07/03/2026')
            ->where('professor.cedula', 'V-11.245.830')
            ->where('sede', 'IMPM Vargas - La Guaira')
            ->where('limits.min_item_weight', 5)
            ->where('limits.max_item_weight', 20)
            ->where('limits.total_weight', 100)
            ->where('limits.passing_grade', 6)
        );
});

test('subjects without class days in the schedule cannot be scheduled', function () {
    $scenario = evaluationPlanScenario();

    $scenario['schedule']->subjects()->updateExistingPivot($scenario['subject']->id, [
        'dates' => json_encode([]),
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('careers.0.cohorts.0.subject_dates.'.$scenario['subject']->id, [])
        );

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('subject_id');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('professors without subjects in a schedule cannot create plans', function () {
    $scenario = evaluationPlanScenario();

    $pending = User::factory()->create(['name' => 'Carmen Alicia Rojas']);
    $pending->assignRole(Role::Profesor->value);
    ProfessorProfile::factory()->create(['user_id' => $pending->id]);

    $this->actingAs($pending)
        ->get(route('professor.plans.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('careers', 0));

    $this->actingAs($pending)
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('subject_id');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('evaluation dates must be class days of the subject schedule', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-05'],
        ]))
        ->assertSessionHasErrors('items.0.scheduled_on');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('professors create a complete plan and the date window is calculated', function () {
    $scenario = evaluationPlanScenario();

    $response = $this->actingAs($scenario['professor'])->post(
        route('professor.plans.store'),
        evaluationPlanPayload($scenario, completeEvaluationItems()),
    );

    $plan = EvaluationPlan::query()->firstOrFail();

    $response->assertRedirect(route('professor.plans.show', $plan));

    expect($plan->items()->count())->toBe(5)
        ->and($plan->items()->orderBy('position')->pluck('position')->all())->toBe([1, 2, 3, 4, 5])
        ->and($plan->totalWeight())->toBe(100)
        ->and($plan->isComplete())->toBeTrue()
        ->and($plan->starts_on->toDateString())->toBe('2026-03-07')
        ->and($plan->ends_on->toDateString())->toBe('2026-05-23');
});

test('the evaluation weights cannot exceed one hundred percent', function () {
    $scenario = evaluationPlanScenario();

    $items = completeEvaluationItems();
    $items[] = ['title' => 'Evaluación extra', 'weight' => 20, 'scheduled_on' => '2026-07-01'];

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, $items))
        ->assertSessionHasErrors('items');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('each evaluation cannot weigh more than twenty percent', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Examen único', 'weight' => 25, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('items.0.weight');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('each evaluation must weigh at least five percent', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Quiz corto', 'weight' => 4, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('items.0.weight');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('a plan requires at least one evaluation', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, []))
        ->assertSessionHasErrors('items');
});

test('the subject must belong to the career of the cohort', function () {
    $scenario = evaluationPlanScenario();

    $otherCareer = Career::factory()->create();
    $foreignSubject = Subject::factory()->for($otherCareer)->create();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload([
            ...$scenario,
            'subject' => $foreignSubject,
        ], [
            ['title' => 'Taller', 'weight' => 10, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('subject_id');
});

test('professors cannot create plans for subjects they do not teach', function () {
    $scenario = evaluationPlanScenario();

    $unassignedSubject = Subject::factory()->for($scenario['career'])->create();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload([
            ...$scenario,
            'subject' => $unassignedSubject,
        ], [
            ['title' => 'Taller', 'weight' => 10, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('subject_id');
});

test('duplicate plans for the same subject, cohort and period are rejected', function () {
    $scenario = evaluationPlanScenario();

    EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 10, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('subject_id');
});

test('professors can add evaluations while weight remains available', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    foreach (array_slice(evaluationClassDates(), 0, 4) as $index => $date) {
        $position = $index + 1;

        $plan->items()->create([
            'position' => $position,
            'title' => "Evaluación {$position}",
            'weight' => 20,
            'scheduled_on' => $date,
        ]);
    }

    $plan->syncScheduleWindow();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.items.store', $plan), [
            'title' => 'Evaluación final',
            'content' => 'Cierre del semestre',
            'weight' => 20,
            'scheduled_on' => '2026-05-23',
        ])
        ->assertSessionHasNoErrors();

    $plan->refresh();

    expect($plan->items()->count())->toBe(5)
        ->and($plan->totalWeight())->toBe(100)
        ->and($plan->ends_on->toDateString())->toBe('2026-05-23');

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.items.store', $plan), [
            'title' => 'Evaluación imposible',
            'weight' => 5,
            'scheduled_on' => '2026-05-16',
        ])
        ->assertSessionHasErrors('weight');
});

test('the sheet offers only the class days of the subject schedule', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('date_options', 12)
            ->where('date_options.0.value', '2026-03-07')
            ->where('date_options.0.label', 'Sáb 07/03/2026')
        );

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.items.store', $plan), [
            'title' => 'Taller fuera del horario',
            'weight' => 20,
            'scheduled_on' => '2026-03-05',
        ])
        ->assertSessionHasErrors('scheduled_on');

    $this->assertDatabaseCount('evaluation_plan_items', 0);
});

test('a plan cannot schedule two evaluations on the same date', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
            ['title' => 'Examen', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasErrors('items.1.scheduled_on');

    $this->assertDatabaseCount('evaluation_plans', 0);
});

test('adding an evaluation cannot reuse a date already scheduled', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);

    $plan->syncScheduleWindow();

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.items.store', $plan), [
            'title' => 'Examen',
            'weight' => 20,
            'scheduled_on' => '2026-03-07',
        ])
        ->assertSessionHasErrors('scheduled_on');

    expect($plan->items()->count())->toBe(1);

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.items.store', $plan), [
            'title' => 'Examen',
            'weight' => 20,
            'scheduled_on' => '2026-03-14',
        ])
        ->assertSessionHasNoErrors();

    expect($plan->items()->count())->toBe(2);
});

test('editing an evaluation cannot reuse the date of another one', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $first = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);
    $second = $plan->items()->create([
        'position' => 2, 'title' => 'Examen', 'weight' => 20, 'scheduled_on' => '2026-03-14',
    ]);

    $plan->syncScheduleWindow();

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.items.update', [$plan, $second]), [
            'title' => 'Examen',
            'weight' => 20,
            'scheduled_on' => '2026-03-07',
        ])
        ->assertSessionHasErrors('scheduled_on');

    expect($second->fresh()->scheduled_on->toDateString())->toBe('2026-03-14');

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.items.update', [$plan, $first]), [
            'title' => 'Taller corregido',
            'weight' => 20,
            'scheduled_on' => '2026-03-07',
        ])
        ->assertSessionHasNoErrors();

    expect($first->fresh()->title)->toBe('Taller corregido');
});

test('editing and deleting evaluations reshuffles the plan', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $first = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);
    $plan->items()->create([
        'position' => 2, 'title' => 'Examen', 'weight' => 20, 'scheduled_on' => '2026-04-11',
    ]);
    $last = $plan->items()->create([
        'position' => 3, 'title' => 'Proyecto', 'weight' => 20, 'scheduled_on' => '2026-05-09',
    ]);

    $plan->syncScheduleWindow();

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.items.update', [$plan, $first]), [
            'title' => 'Taller corregido',
            'weight' => 10,
            'scheduled_on' => '2026-03-07',
        ])
        ->assertSessionHasNoErrors();

    expect($first->fresh()->weight)->toBe(10)
        ->and($first->fresh()->title)->toBe('Taller corregido');

    EvaluationPlanScore::query()->create([
        'evaluation_plan_item_id' => $first->id,
        'enrollment_id' => Enrollment::factory()->create([
            'subject_id' => $scenario['subject']->id,
            'academic_period_id' => $scenario['period']->id,
        ])->id,
        'score' => 15,
    ]);

    $this->actingAs($scenario['professor'])
        ->delete(route('professor.plans.items.destroy', [$plan, $last]))
        ->assertSessionHasNoErrors();

    $this->actingAs($scenario['professor'])
        ->delete(route('professor.plans.items.destroy', [$plan, $first]))
        ->assertSessionHasNoErrors();

    $remaining = $plan->items()->get();

    expect($remaining)->toHaveCount(1)
        ->and($remaining->first()->position)->toBe(1)
        ->and($remaining->first()->title)->toBe('Examen')
        ->and($plan->fresh()->ends_on->toDateString())->toBe('2026-04-11');

    expect(EvaluationPlanScore::query()->where('evaluation_plan_item_id', $first->id)->exists())->toBeFalse();
});

test('the definitive grade is weighted by each evaluation and shown on the ten scale', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $first = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);
    $second = $plan->items()->create([
        'position' => 2, 'title' => 'Examen', 'weight' => 10, 'scheduled_on' => '2026-03-14',
    ]);

    $plan->syncScheduleWindow();

    $enrollment = Enrollment::factory()->create([
        'student_id' => User::factory()->create(['name' => 'Luis Estudiante'])->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
        'professor_id' => $scenario['professor']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.scores.update', $plan), [
            'scores' => [
                ['item_id' => $first->id, 'enrollment_id' => $enrollment->id, 'score' => 20],
                ['item_id' => $second->id, 'enrollment_id' => $enrollment->id, 'score' => 12],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect(EvaluationPlanScore::query()->count())->toBe(2);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('professor/plans/show')
            ->where('header.profesor', 'Ana Pérez')
            ->where('header.cedula', 'V-11.245.830')
            ->where('header.programa', 'Pregrado')
            ->where('header.especialidad', 'Educación Primaria')
            ->where('header.curso', 'TIC-101 - TIC I')
            ->where('header.periodo', '2025-II')
            ->where('header.horario', 'Sabatino')
            ->where('header.ambiente', 'Presencial')
            ->where('header.cohorte', '2025-II')
            ->where('header.fecha_inicio', '07/03/2026')
            ->where('header.fecha_fin', '14/03/2026')
            ->where('plan.total_weight', 30)
            ->where('plan.remaining_weight', 70)
            ->where('plan.is_complete', false)
            ->has('students', 1)
            ->where('students.0.student_name', 'Luis Estudiante')
            ->where('students.0.definitive', 17.33)
            ->where('students.0.definitive_ten', 8.67)
            ->where('students.0.approved', true)
        );

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.scores.update', $plan), [
            'scores' => [
                ['item_id' => $second->id, 'enrollment_id' => $enrollment->id, 'score' => null],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect(EvaluationPlanScore::query()->count())->toBe(1);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertInertia(fn (Assert $page) => $page
            ->where('students.0.definitive', 20)
            ->where('students.0.definitive_ten', 10)
        );
});

test('evaluation scores must stay between one and twenty', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $item = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);

    $enrollment = Enrollment::factory()->create([
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.scores.update', $plan), [
            'scores' => [
                ['item_id' => $item->id, 'enrollment_id' => $enrollment->id, 'score' => 21],
            ],
        ])
        ->assertSessionHasErrors('scores.0.score');

    $this->assertDatabaseCount('evaluation_plan_scores', 0);
});

test('the plan ambient is taken from the subject modality', function () {
    $scenario = evaluationPlanScenario();
    $scenario['subject']->update(['modality' => 'online']);

    $this->actingAs($scenario['professor'])
        ->post(route('professor.plans.store'), evaluationPlanPayload($scenario, [
            ['title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07'],
        ]))
        ->assertSessionHasNoErrors();

    $plan = EvaluationPlan::query()->firstOrFail();

    expect($plan->modality)->toBe('online');

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertInertia(fn (Assert $page) => $page
            ->where('header.ambiente', 'Online')
        );
});

test('professors only see their own subjects in the listing', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    Enrollment::factory()->create([
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $otherProfessor = User::factory()->create();
    $otherProfessor->assignRole(Role::Profesor->value);

    $this->actingAs($otherProfessor)
        ->get(route('professor.plans.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('professor/plans/index')
            ->has('subjects', 0)
        );

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('subjects', 1)
            ->where('subjects.0.course', 'TIC-101 - TIC I')
            ->where('subjects.0.cohort', '2025-II')
            ->where('subjects.0.plan_id', $plan->id)
            ->where('subjects.0.students_count', 1)
            ->where('summary.plans_count', 1)
            ->where('summary.subjects_count', 1)
        );
});

test('the plans listing includes assigned subjects without a plan', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('subjects', 1)
            ->where('subjects.0.course', 'TIC-101 - TIC I')
            ->where('subjects.0.plan_id', null)
            ->where('subjects.0.items_count', 0)
            ->where('subjects.0.is_complete', false)
            ->where('summary.plans_count', 0)
            ->where('summary.subjects_count', 1)
        );
});

test('the plan form preselects the subject of the schedule', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.create', [
            'subject_id' => $scenario['subject']->id,
            'schedule_id' => $scenario['schedule']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('professor/plans/create')
            ->where('defaults.subject_id', $scenario['subject']->id)
            ->where('defaults.schedule_id', $scenario['schedule']->id)
        );
});

test('other professors cannot manage the plan of a colleague', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $item = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);

    $intruder = User::factory()->create();
    $intruder->assignRole(Role::Profesor->value);

    $this->actingAs($intruder)->get(route('professor.plans.show', $plan))->assertForbidden();
    $this->actingAs($intruder)->put(route('professor.plans.items.update', [$plan, $item]), [
        'title' => 'Alterado', 'weight' => 10, 'scheduled_on' => '2026-03-07',
    ])->assertForbidden();
    $this->actingAs($intruder)->put(route('professor.plans.scores.update', $plan), ['scores' => []])->assertForbidden();
    $this->actingAs($intruder)->delete(route('professor.plans.destroy', $plan))->assertForbidden();

    expect($plan->fresh())->not->toBeNull()
        ->and($item->fresh()->title)->toBe('Taller');
});

test('professors can delete their plan with its evaluations', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);

    $this->actingAs($scenario['professor'])
        ->delete(route('professor.plans.destroy', $plan))
        ->assertRedirect(route('professor.plans.index'));

    $this->assertDatabaseCount('evaluation_plans', 0);
    $this->assertDatabaseCount('evaluation_plan_items', 0);
});

test('students cannot access the evaluation plans', function () {
    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);

    $this->actingAs($student)
        ->get(route('professor.plans.index'))
        ->assertForbidden();
});

test('guests are redirected to the login page', function () {
    $this->get(route('professor.plans.index'))->assertRedirect(route('login'));
});

test('the plan sheet exposes the official student columns', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $student = User::factory()->create(['name' => 'Luis Estudiante']);

    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'career_id' => $scenario['career']->id,
        'current_semester' => 3,
        'admission_year' => 2021,
    ]);

    Admission::factory()->create([
        'career_id' => $scenario['career']->id,
        'converted_user_id' => $student->id,
        'id_number' => '15267143',
    ]);

    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('header.especialidad_codigo', 'EDPRI')
            ->has('students', 1)
            ->where('students.0.id_number', '15267143')
            ->where('students.0.semester', 3)
            ->where('students.0.enrolled', true)
            ->where('students.0.current_cohort', '2025-II')
            ->where('students.0.cohort', '2025-II')
            ->where('students.0.career_code', 'EDPRI')
        );
});

test('cohort students without enrollment are listed and graded into a new enrollment', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $item = $plan->items()->create([
        'position' => 1, 'title' => 'Taller', 'weight' => 20, 'scheduled_on' => '2026-03-07',
    ]);

    $student = User::factory()->create(['name' => 'María Fernanda Pérez']);

    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'career_id' => $scenario['career']->id,
        'current_semester' => 5,
        'admission_year' => 2021,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.plans.show', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('students', 1)
            ->where('students.0.student_name', 'María Fernanda Pérez')
            ->where('students.0.enrolled', false)
            ->where('students.0.enrollment_id', null)
            ->where('students.0.current_cohort', '2025-II')
            ->where('students.0.cohort', '2021')
        );

    $this->actingAs($scenario['professor'])
        ->put(route('professor.plans.scores.update', $plan), [
            'scores' => [
                ['item_id' => $item->id, 'student_id' => $student->id, 'score' => 18],
            ],
        ])
        ->assertSessionHasNoErrors();

    $enrollment = Enrollment::query()
        ->where('student_id', $student->id)
        ->where('subject_id', $scenario['subject']->id)
        ->where('academic_period_id', $scenario['period']->id)
        ->first();

    expect($enrollment)->not->toBeNull()
        ->and($enrollment->professor_id)->toBe($scenario['professor']->id)
        ->and($enrollment->status)->toBe('cursando')
        ->and((float) EvaluationPlanScore::query()->where('enrollment_id', $enrollment->id)->value('score'))->toBe(18.0);
});

test('the grades page shows the plan sheet to load grades per evaluation', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $item = $plan->items()->create([
        'position' => 1,
        'title' => 'Exposición',
        'weight' => 20,
        'scheduled_on' => '2026-03-07',
    ]);

    $student = User::factory()->create(['name' => 'Ana Gabriela Martínez']);

    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'career_id' => $scenario['career']->id,
        'current_semester' => 1,
        'admission_year' => 2025,
    ]);

    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
        'professor_id' => $scenario['professor']->id,
    ]);

    EvaluationPlanScore::factory()->create([
        'evaluation_plan_item_id' => $item->id,
        'enrollment_id' => $enrollment->id,
        'score' => 18,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.grades.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/grades')
            ->where('careers.0.subjects.0.plan.id', $plan->id)
            ->where('careers.0.subjects.0.plan.total_weight', 20)
            ->has('careers.0.subjects.0.plan.items', 1)
            ->where('careers.0.subjects.0.plan.items.0.title', 'Exposición')
            ->where('careers.0.subjects.0.plan.items.0.scheduled_on', '07/03/2026')
            ->has('careers.0.subjects.0.plan.students', 1)
            ->where('careers.0.subjects.0.plan.students.0.student_name', 'Ana Gabriela Martínez')
            ->where('careers.0.subjects.0.plan.students.0.scores.'.$item->id, 18)
            ->where('limits.passing_grade', 6)
        );
});

test('the grades page marks subjects without an evaluation plan', function () {
    $scenario = evaluationPlanScenario();

    $student = User::factory()->create();

    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'career_id' => $scenario['career']->id,
    ]);

    Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
        'professor_id' => $scenario['professor']->id,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.grades.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/grades')
            ->where('careers.0.subjects.0.plan', null)
            ->where('limits.final_scale', 10)
        );
});

test('the grades page focuses the subject and student of the link', function () {
    $scenario = evaluationPlanScenario();

    $this->actingAs($scenario['professor'])
        ->get(route('professor.grades.index', [
            'materia' => $scenario['subject']->id,
            'estudiante' => 99,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/grades')
            ->where('focus.subject_id', $scenario['subject']->id)
            ->where('focus.student_id', 99)
            ->where('focus.career_id', $scenario['career']->id)
        );
});

test('the students page shows only the final grade of the record', function () {
    $scenario = evaluationPlanScenario();

    $plan = EvaluationPlan::factory()->create([
        'professor_id' => $scenario['professor']->id,
        'schedule_id' => $scenario['schedule']->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
    ]);

    $plan->items()->create([
        'position' => 1,
        'title' => 'Exposición',
        'weight' => 20,
        'scheduled_on' => '2026-03-07',
    ]);

    $student = User::factory()->create(['name' => 'Luis Miguel Herrera']);

    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'subject_id' => $scenario['subject']->id,
        'academic_period_id' => $scenario['period']->id,
        'professor_id' => $scenario['professor']->id,
        'final_grade' => 8.5,
    ]);

    $this->actingAs($scenario['professor'])
        ->get(route('professor.students'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/professor/students')
            ->where('careers.0.subjects.0.plan.id', $plan->id)
            ->missing('careers.0.subjects.0.plan.items')
            ->has('careers.0.subjects.0.students', 1)
            ->where('careers.0.subjects.0.students.0.student_id', $student->id)
            ->where('careers.0.subjects.0.students.0.enrollment_id', $enrollment->id)
            ->where('careers.0.subjects.0.students.0.grade', 8.5)
            ->where('summary.graded_count', 1)
        );
});

test('the professor workspace pages are private to professors', function () {
    $student = User::factory()->create();
    $student->assignRole(Role::Estudiante->value);

    $this->actingAs($student)->get(route('professor.students'))->assertForbidden();
    $this->actingAs($student)->get(route('professor.grades.index'))->assertForbidden();
    $this->actingAs($student)->get(route('professor.careers'))->assertForbidden();
});
