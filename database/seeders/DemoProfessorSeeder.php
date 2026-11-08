<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Career;
use App\Models\ProfessorProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoProfessorSeeder extends Seeder
{
    /**
     * Crea perfiles docentes de demostración y los asigna a materias de Primaria.
     */
    public function run(): void
    {
        $career = Career::query()->where('code', 'EDPRI')->firstOrFail();
        $professors = [
            [
                'name' => 'Edilia Díaz',
                'email' => 'edilia.diaz.demo@upel.test',
                'employee_code' => 'DEMO-PROF-101',
                'department' => 'Lengua y Literatura',
                'academic_title' => 'Licenciada en Educación',
                'subject' => 'Introducción al Estudio de la Lengua',
            ],
            [
                'name' => 'María De Abreu',
                'email' => 'maria.deabreu.demo@upel.test',
                'employee_code' => 'DEMO-PROF-102',
                'department' => 'Educación Integral',
                'academic_title' => 'Magíster en Educación',
                'subject' => 'Educación Alimentaria y Nutrición',
            ],
            [
                'name' => 'Amada Prim',
                'email' => 'amada.prim.demo@upel.test',
                'employee_code' => 'DEMO-PROF-103',
                'department' => 'Psicología Educativa',
                'academic_title' => 'Doctora en Educación',
                'subject' => 'Desarrollo de Procesos Cognitivos',
            ],
            [
                'name' => 'Benilde Figueroa',
                'email' => 'benilde.figueroa.demo@upel.test',
                'employee_code' => 'DEMO-PROF-104',
                'department' => 'Pedagogía',
                'academic_title' => 'Magíster en Educación',
                'subject' => 'Fundamentos de la Educación Primaria',
            ],
            [
                'name' => 'Leonardo Díaz',
                'email' => 'leonardo.diaz.demo@upel.test',
                'employee_code' => 'DEMO-PROF-105',
                'department' => 'Ciencias Sociales',
                'academic_title' => 'Licenciado en Educación',
                'subject' => 'Sociedad y Educación',
            ],
            [
                'name' => 'José Peñaloza',
                'email' => 'jose.penaloza.demo@upel.test',
                'employee_code' => 'DEMO-PROF-106',
                'department' => 'Investigación Educativa',
                'academic_title' => 'Doctor en Educación',
                'subject' => 'Investigación I',
            ],
            [
                'name' => 'Christian Alviarez',
                'email' => 'christian.alviarez.demo@upel.test',
                'employee_code' => 'DEMO-PROF-107',
                'department' => 'Tecnología Educativa',
                'academic_title' => 'Especialista en Tecnología Educativa',
                'subject' => 'TIC I',
            ],
        ];

        foreach ($professors as $professorData) {
            $user = User::query()->firstOrCreate(
                ['email' => $professorData['email']],
                [
                    'name' => $professorData['name'],
                    'password' => 'DemoProfesor123!',
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ],
            );
            $user->assignRole(Role::Profesor->value);

            $profile = ProfessorProfile::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'employee_code' => $professorData['employee_code'],
                    'department' => $professorData['department'],
                    'academic_title' => $professorData['academic_title'],
                ],
            );

            $subject = Subject::query()
                ->whereBelongsTo($career)
                ->where('name', $professorData['subject'])
                ->firstOrFail();

            $profile->subjects()->syncWithoutDetaching([$subject->id]);
        }
    }
}
