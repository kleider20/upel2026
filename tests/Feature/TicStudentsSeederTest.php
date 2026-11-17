<?php

use App\Enums\Role;
use App\Models\Admission;
use App\Models\Career;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\AcademicSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TicStudentsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed([
        RolePermissionSeeder::class,
        AcademicSeeder::class,
    ]);
});

/**
 * Cantidad de estudiantes por carrera y cohorte según la planilla de TIC I.
 *
 * @return array<string, int>
 */
function ticStudentsByCohort(): array
{
    return [
        'EDPRI|2021-I' => 2,
        'EDPRI|2025-II' => 24,
        'GEHIS|2025-II' => 12,
        'LENLI|2023' => 1,
        'LENLI|2024' => 1,
        'LENLI|2025-I' => 5,
        'LENLI|2025-II' => 15,
    ];
}

test('the TIC I roster is seeded with cédula, cohorte and especialidad', function () {
    $this->seed(TicStudentsSeeder::class);

    expect(StudentProfile::query()->whereNotNull('identity_document')->count())->toBe(60);

    $distribution = StudentProfile::query()
        ->join('careers', 'careers.id', '=', 'student_profiles.career_id')
        ->whereNotNull('student_profiles.identity_document')
        ->get(['careers.code', 'student_profiles.cohort'])
        ->countBy(fn (StudentProfile $profile): string => $profile->code.'|'.$profile->cohort)
        ->sortKeys()
        ->all();

    $expected = ticStudentsByCohort();
    ksort($expected);

    expect($distribution)->toBe($expected);

    $student = User::query()->where('email', 'v18534451@estudiante.upel.edu.ve')->sole();
    $profile = $student->studentProfile()->firstOrFail();

    expect($student->name)->toBe('Kleider Keith Rosamilia Rojas')
        ->and($student->hasRole(Role::Estudiante->value))->toBeTrue()
        ->and($student->must_change_password)->toBeTrue()
        ->and(Hash::check('18534451', $student->password))->toBeTrue()
        ->and($profile->identity_document)->toBe('18534451')
        ->and($profile->cohort)->toBe('2025-II')
        ->and($profile->admission_year)->toBe(2025)
        ->and($profile->student_code)->toStartWith('EST-2025-')
        ->and($profile->career->code)->toBe('EDPRI');
});

test('seeding again keeps the roster without duplicating students', function () {
    $this->seed(TicStudentsSeeder::class);
    $this->seed(TicStudentsSeeder::class);

    expect(StudentProfile::query()->count())->toBe(60)
        ->and(User::query()->where('email', 'like', 'v%@estudiante.upel.edu.ve')->count())->toBe(60)
        ->and(StudentProfile::query()->select('identity_document')
            ->whereNotNull('identity_document')
            ->get()
            ->countBy('identity_document')
            ->filter(fn (int $total): bool => $total > 1)
            ->all())->toBe([]);
});

test('students already registered keep their admission year and coding', function () {
    $career = Career::query()->where('code', 'EDPRI')->sole();

    $student = User::factory()->create(['name' => 'Kleider Keith Rosamilia Rojas']);
    $student->assignRole(Role::Estudiante->value);

    $profile = StudentProfile::factory()->create([
        'user_id' => $student->id,
        'career_id' => $career->id,
        'student_code' => 'EST-2027-001',
        'admission_year' => 2027,
    ]);

    Admission::factory()->create([
        'career_id' => $career->id,
        'converted_user_id' => $student->id,
        'id_number' => '18534451',
    ]);

    $this->seed(TicStudentsSeeder::class);

    expect(StudentProfile::query()->count())->toBe(60)
        ->and(User::query()->where('email', 'v18534451@estudiante.upel.edu.ve')->exists())->toBeFalse();

    $profile->refresh();

    expect($profile->identity_document)->toBe('18534451')
        ->and($profile->cohort)->toBe('2025-II')
        ->and($profile->admission_year)->toBe(2027)
        ->and($profile->student_code)->toBe('EST-2027-001');
});
