<?php

use App\Enums\Role;
use App\Models\Career;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Usuario con permisos académicos para gestionar pensums.
 */
function pensumManager(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::CoordinadorAcademico->value);

    return $user;
}

test('guests are redirected to the admin login page from pensums', function () {
    $this->get(route('admin.pensums.index'))
        ->assertRedirect(route('admin.login'));
});

test('financial staff cannot access pensums', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.pensums.index'))
        ->assertForbidden();
});

test('academic managers can list careers with their pensum summary', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'icon' => '📚',
    ]);

    Subject::factory()->for($career)->create(['semester' => 1, 'credits' => 4]);
    Subject::factory()->for($career)->create(['semester' => 1, 'credits' => 3]);
    Subject::factory()->for($career)->create(['semester' => 2, 'credits' => 5]);

    $this->actingAs(pensumManager())
        ->get(route('admin.pensums.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pensums/index')
            ->has('careers', 1)
            ->where('careers.0.name', 'Educación Primaria')
            ->where('careers.0.code', 'EDPRI')
            ->where('careers.0.icon', '📚')
            ->where('careers.0.subjects_count', 3)
            ->where('careers.0.semesters_count', 2)
            ->where('careers.0.credits_total', 12)
            ->where('careers.0.show_url', route('admin.pensums.show', ['career' => 'EDPRI']))
            ->where('can_manage', true)
            ->has('stats', 4)
        );
});

test('academic managers can open a career pensum grouped by semester', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'degree' => 'Licenciatura',
        'icon' => '📚',
        'duration_semesters' => 8,
    ]);

    Subject::factory()->for($career)->create([
        'name' => 'Didáctica General',
        'code' => 'DID-101',
        'semester' => 1,
        'credits' => 4,
        'component' => 'CFPE',
        'type' => 'UNCO',
        'area' => 'FUND',
        'level' => 'I',
        'is_active' => true,
    ]);
    Subject::factory()->for($career)->create([
        'name' => 'Psicología del Desarrollo',
        'code' => 'PSI-101',
        'semester' => 1,
        'credits' => 3,
        'is_active' => true,
    ]);
    Subject::factory()->for($career)->create([
        'name' => 'Currículo',
        'code' => 'CUR-201',
        'semester' => 2,
        'credits' => 5,
        'is_active' => false,
    ]);

    $this->actingAs(pensumManager())
        ->get(route('admin.pensums.show', ['career' => 'EDPRI']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pensums/show')
            ->where('career.name', 'Educación Primaria')
            ->where('career.code', 'EDPRI')
            ->where('career.degree', 'Licenciatura')
            ->where('career.subjects_count', 3)
            ->where('career.credits_total', 12)
            ->where('can_manage', true)
            ->has('pensum', 2)
            ->where('pensum.0.semester', 1)
            ->where('pensum.0.label', 'I')
            ->where('pensum.0.credits', 7)
            ->has('pensum.0.subjects', 2)
            ->where('pensum.0.subjects.0.component', 'CFPE')
            ->where('pensum.1.semester', 2)
            ->where('pensum.1.subjects.0.is_active', false)
            ->where('pensum.1.subjects.0.edit_url', route('admin.subjects.edit', [
                'subject' => Subject::query()->where('code', 'CUR-201')->firstOrFail(),
                'return_to' => 'pensum',
            ]))
        );
});

test('academic managers can view and download a career pensum as a PDF', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
    ]);

    Subject::factory()->for($career)->create([
        'name' => 'Didactica General',
        'semester' => 1,
        'component' => 'CFPE',
        'type' => 'UNCO',
        'credits' => 4,
    ]);

    $manager = pensumManager();
    $pdfUrl = route('admin.pensums.pdf', ['career' => $career->code]);

    $preview = $this->actingAs($manager)->get($pdfUrl);
    $preview
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename="pensum-EDPRI.pdf"');

    $pdfContent = $preview->getContent();
    preg_match('/startxref\n(\d+)\n%%EOF/', $pdfContent, $xrefMatch);

    expect($pdfContent)
        ->toStartWith('%PDF-1.4')
        ->toContain('(Didactica General) Tj ET')
        ->toContain('startxref')
        ->and($xrefMatch)->not->toBeEmpty()
        ->and(substr($pdfContent, (int) $xrefMatch[1], 4))->toBe('xref');

    $this->get($pdfUrl.'?download=1')
        ->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename="pensum-EDPRI.pdf"');
});

test('users without academic permissions cannot access a career pensum PDF', function () {
    $career = Career::factory()->create(['code' => 'EDPRI']);
    $user = User::factory()->create();
    $user->assignRole(Role::PersonalAdministrativo->value);

    $this->actingAs($user)
        ->get(route('admin.pensums.pdf', ['career' => $career->code]))
        ->assertForbidden();
});
