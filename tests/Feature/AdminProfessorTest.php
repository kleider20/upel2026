<?php

use App\Enums\Permission;
use App\Enums\Role;
use App\Models\Career;
use App\Models\ProfessorProfile;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role as SpatieRole;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario administrativo con permisos académicos completos.
 */
function professorManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

test('guests are redirected to the admin login page', function () {
    $this->get(route('admin.professors.index'))
        ->assertRedirect(route('admin.login'));
});

test('users with professor view permission cannot manage accounts or assignments', function () {
    $role = SpatieRole::findByName(Role::CoordinadorAcademico->value, 'web');
    $role->syncPermissions([Permission::ProfessorsView->value]);
    $manager = User::factory()->create();
    $manager->assignRole($role);
    $professor = ProfessorProfile::factory()->create();

    $this->actingAs($manager)
        ->get(route('admin.professors.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/professors/index')
            ->where('can_manage', false)
            ->where('can_delete', false)
            ->where('professors.data.0.edit_url', null)
            ->where('professors.data.0.delete_url', null)
        );

    $this->actingAs($manager)
        ->get(route('admin.professors.edit', $professor))
        ->assertForbidden();

    $this->actingAs($manager)
        ->post(route('admin.professors.store'), [])
        ->assertForbidden();

    expect(ProfessorProfile::query()->count())->toBe(1);
});

test('academic managers can search professors and review their assigned subjects', function () {
    $career = Career::factory()->create(['name' => 'Educación Primaria']);
    $subject = Subject::factory()->for($career)->create([
        'name' => 'Aprendizaje Matemático 1',
        'code' => 'AMI-PA1',
        'semester' => 1,
    ]);
    $professor = ProfessorProfile::factory()->create([
        'employee_code' => 'PROF-101',
        'department' => 'Educación Matemática',
    ]);
    $professor->subjects()->attach($subject);

    $this->actingAs(professorManager())
        ->get(route('admin.professors.index', ['search' => 'Aprendizaje']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/professors/index')
            ->has('professors.data', 1)
            ->where('professors.data.0.name', $professor->user->name)
            ->where('professors.data.0.employee_code', 'PROF-101')
            ->where('professors.data.0.subjects_count', 1)
            ->where('professors.data.0.subjects.0.name', 'Aprendizaje Matemático 1')
            ->where('professors.data.0.subjects.0.career', 'Educación Primaria')
            ->where('filters.search', 'Aprendizaje')
            ->where('can_manage', true)
            ->where('can_delete', false)
        );
});

test('professors with view permission can open a professor profile', function () {
    $role = SpatieRole::findByName(Role::CoordinadorAcademico->value, 'web');
    $role->syncPermissions([Permission::ProfessorsView->value]);
    $viewer = User::factory()->create();
    $viewer->assignRole($role);

    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
    ]);
    $subject = Subject::factory()->for($career)->create([
        'name' => 'Aprendizaje Matemático 1',
        'code' => 'AMI-PA1',
        'semester' => 1,
    ]);
    $professor = ProfessorProfile::factory()->create([
        'employee_code' => 'PROF-150',
        'department' => 'Educación Matemática',
        'academic_title' => 'Magíster en Educación',
    ]);
    $professor->subjects()->attach($subject);

    $this->actingAs($viewer)
        ->get(route('admin.professors.show', $professor))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/professors/show')
            ->where('professor.name', $professor->user->name)
            ->where('professor.employee_code', 'PROF-150')
            ->where('professor.department', 'Educación Matemática')
            ->where('professor.subjects_count', 1)
            ->where('professor.subjects.0.name', 'Aprendizaje Matemático 1')
            ->where('professor.subjects.0.career', 'Educación Primaria')
            ->where('professor.subjects.0.semester', 1)
            ->where('professor.edit_url', null)
            ->where('professor.delete_url', null)
        );
});

test('only users with delete permission can remove a professor account', function () {
    $subject = Subject::factory()->create();
    $professor = ProfessorProfile::factory()->create([
        'employee_code' => 'PROF-600',
    ]);
    $professor->subjects()->attach($subject);

    $this->actingAs(professorManager())
        ->delete(route('admin.professors.destroy', $professor))
        ->assertForbidden();

    expect(User::query()->whereKey($professor->user_id)->exists())->toBeTrue();

    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    $this->actingAs($admin)
        ->delete(route('admin.professors.destroy', $professor))
        ->assertRedirect(route('admin.professors.index'));

    expect(User::query()->whereKey($professor->user_id)->exists())->toBeFalse();
    $this->assertDatabaseMissing('professor_profiles', ['id' => $professor->id]);
    $this->assertDatabaseMissing('professor_subjects', [
        'professor_id' => $professor->user_id,
    ]);
});

test('administrator accounts with a professor profile cannot be deleted', function () {
    $adminProfessor = ProfessorProfile::factory()->create();
    $adminProfessor->user->assignRole(Role::Admin->value);

    $admin = User::factory()->create();
    $admin->assignRole(Role::Admin->value);

    $this->actingAs($admin)
        ->delete(route('admin.professors.destroy', $adminProfessor))
        ->assertForbidden();

    expect(User::query()->whereKey($adminProfessor->user_id)->exists())->toBeTrue();
});

test('academic managers can create a professor account with a temporary password and subject assignments', function () {
    $career = Career::factory()->create();
    $subject = Subject::factory()->for($career)->create();

    $this->actingAs(professorManager())
        ->post(route('admin.professors.store'), [
            'name' => 'Héctor Rosales',
            'email' => 'HECTOR.ROSALES@example.com',
            'employee_code' => ' prof-204 ',
            'department' => 'Educación Matemática',
            'academic_title' => 'Magíster en Educación',
            'password' => 'Pr0fessorTemp#2026',
            'password_confirmation' => 'Pr0fessorTemp#2026',
            'subject_ids' => [$subject->id],
        ])
        ->assertRedirect(route('admin.professors.index'));

    $user = User::query()->where('email', 'hector.rosales@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Héctor Rosales')
        ->and($user->must_change_password)->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->hasRole(Role::Profesor->value))->toBeTrue()
        ->and(Hash::check('Pr0fessorTemp#2026', $user->password))->toBeTrue();

    $professor = $user->professorProfile;

    expect($professor->employee_code)->toBe('PROF-204')
        ->and($professor->subjects->modelKeys())->toBe([$subject->id]);

    $this->assertDatabaseHas('professor_subjects', [
        'professor_id' => $user->id,
        'subject_id' => $subject->id,
    ]);

    $this->actingAs(professorManager())
        ->get(route('admin.schedules.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schedules/form')
            ->where('subjects.0.professors.0.id', $user->id)
            ->where('subjects.0.professors.0.name', 'Héctor Rosales')
        );
});

test('invalid temporary credentials and unknown subjects do not create a professor', function () {
    $this->actingAs(professorManager())
        ->post(route('admin.professors.store'), [
            'name' => 'Profesor de prueba',
            'email' => 'profesor.prueba@example.com',
            'employee_code' => 'PROF-305',
            'password' => 'short',
            'password_confirmation' => 'different',
            'subject_ids' => [999999],
        ])
        ->assertSessionHasErrors(['password', 'subject_ids.0']);

    expect(User::query()->where('email', 'profesor.prueba@example.com')->exists())
        ->toBeFalse();
    expect(ProfessorProfile::query()->count())->toBe(0);
});

test('academic managers can edit a professor and replace assigned subjects', function () {
    $oldSubject = Subject::factory()->create();
    $newSubject = Subject::factory()->create();
    $user = User::factory()->create([
        'name' => 'Nombre anterior',
        'email' => 'profesor.anterior@example.com',
        'must_change_password' => false,
    ]);
    $user->assignRole(Role::Profesor->value);
    $professor = ProfessorProfile::factory()->for($user)->create([
        'employee_code' => 'PROF-410',
    ]);
    $professor->subjects()->attach($oldSubject);

    $this->actingAs(professorManager())
        ->put(route('admin.professors.update', $professor), [
            'name' => 'Nombre corregido',
            'email' => 'profesor.corregido@example.com',
            'employee_code' => 'prof-411',
            'department' => 'Pedagogía',
            'academic_title' => 'Doctor en Educación',
            'subject_ids' => [$newSubject->id],
        ])
        ->assertRedirect(route('admin.professors.index'));

    $professor->refresh();
    $user->refresh();

    expect($user->name)->toBe('Nombre corregido')
        ->and($user->email)->toBe('profesor.corregido@example.com')
        ->and($user->must_change_password)->toBeFalse();

    expect($professor->employee_code)->toBe('PROF-411')
        ->and($professor->department)->toBe('Pedagogía')
        ->and($professor->subjects->modelKeys())->toBe([$newSubject->id]);

    $this->assertDatabaseMissing('professor_subjects', [
        'professor_id' => $user->id,
        'subject_id' => $oldSubject->id,
    ]);
    $this->assertDatabaseHas('professor_subjects', [
        'professor_id' => $user->id,
        'subject_id' => $newSubject->id,
    ]);
});

test('duplicate professor email and employee code are rejected', function () {
    $existingProfessor = ProfessorProfile::factory()->create([
        'employee_code' => 'PROF-501',
    ]);

    $this->actingAs(professorManager())
        ->post(route('admin.professors.store'), [
            'name' => 'Otro profesor',
            'email' => $existingProfessor->user->email,
            'employee_code' => 'PROF-501',
            'department' => '',
            'academic_title' => '',
            'password' => 'Pr0fessorTemp#2026',
            'password_confirmation' => 'Pr0fessorTemp#2026',
            'subject_ids' => [],
        ])
        ->assertSessionHasErrors(['email', 'employee_code']);

    expect(ProfessorProfile::query()->count())->toBe(1);
});
