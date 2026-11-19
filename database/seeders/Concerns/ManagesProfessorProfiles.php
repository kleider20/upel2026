<?php

namespace Database\Seeders\Concerns;

use App\Models\Career;
use App\Models\ProfessorProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Arr;

/**
 * Crea o actualiza el perfil docente y le asocia las materias que imparte.
 */
trait ManagesProfessorProfiles
{
    /**
     * Perfil docente de la cuenta indicada.
     *
     * @param  array<string, mixed>  $data  employee_code, identity_document, department, academic_title
     */
    protected function createProfessorProfile(User $user, array $data): ProfessorProfile
    {
        return ProfessorProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            Arr::only($data, [
                'employee_code',
                'identity_document',
                'department',
                'academic_title',
            ]),
        );
    }

    /**
     * Asocia una materia a la carga académica del docente sin duplicarla.
     */
    protected function assignTaughtSubject(ProfessorProfile $profile, Career $career, string $subjectName): void
    {
        $subject = Subject::query()
            ->whereBelongsTo($career)
            ->where('name', $subjectName)
            ->firstOrFail();

        $profile->subjects()->syncWithoutDetaching([$subject->id]);
    }
}
