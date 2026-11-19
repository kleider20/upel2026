<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\User;
use Database\Seeders\Concerns\ManagesProfessorProfiles;
use Database\Seeders\Concerns\ResolvesAcademicEntities;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;

class DemoProfessorSeeder extends Seeder
{
    use ManagesProfessorProfiles, ResolvesAcademicEntities, SyncsRolePermissions;

    /**
     * Contraseña inicial de los docentes de demostración; se cambia al primer acceso.
     */
    public const DEMO_PASSWORD = 'test123';

    /**
     * Crea perfiles docentes de demostración y los asigna a materias de Primaria.
     */
    public function run(): void
    {
        $career = $this->getCareer('EDPRI');
        $professors = [
            [
                'name' => 'Edilia Díaz',
                'email' => 'edilia.diaz.demo@upel.test',
                'employee_code' => 'DEMO-PROF-101',
                'identity_document' => 'V-9.874.112',
                'department' => 'Lengua y Literatura',
                'academic_title' => 'Licenciada en Educación',
                'subject' => 'Introducción al Estudio de la Lengua',
            ],
            [
                'name' => 'María De Abreu',
                'email' => 'maria.deabreu.demo@upel.test',
                'employee_code' => 'DEMO-PROF-102',
                'identity_document' => 'V-12.334.905',
                'department' => 'Educación Integral',
                'academic_title' => 'Magíster en Educación',
                'subject' => 'Educación Alimentaria y Nutrición',
            ],
            [
                'name' => 'Amada Prim',
                'email' => 'amada.prim.demo@upel.test',
                'employee_code' => 'DEMO-PROF-103',
                'identity_document' => 'V-7.221.486',
                'department' => 'Psicología Educativa',
                'academic_title' => 'Doctora en Educación',
                'subject' => 'Desarrollo de Procesos Cognitivos',
            ],
            [
                'name' => 'Benilde Figueroa',
                'email' => 'benilde.figueroa.demo@upel.test',
                'employee_code' => 'DEMO-PROF-104',
                'identity_document' => 'V-10.556.773',
                'department' => 'Pedagogía',
                'academic_title' => 'Magíster en Educación',
                'subject' => 'Fundamentos de la Educación Primaria',
            ],
            [
                'name' => 'Leonardo Díaz',
                'email' => 'leonardo.diaz.demo@upel.test',
                'employee_code' => 'DEMO-PROF-105',
                'identity_document' => 'V-14.009.238',
                'department' => 'Ciencias Sociales',
                'academic_title' => 'Licenciado en Educación',
                'subject' => 'Sociedad y Educación',
            ],
            [
                'name' => 'José Peñaloza',
                'email' => 'jose.penaloza.demo@upel.test',
                'employee_code' => 'DEMO-PROF-106',
                'identity_document' => 'V-8.665.410',
                'department' => 'Investigación Educativa',
                'academic_title' => 'Doctor en Educación',
                'subject' => 'Investigación I',
            ],
            [
                'name' => 'Christian Alviarez',
                'email' => 'christian.alviarez.demo@upel.test',
                'employee_code' => 'DEMO-PROF-107',
                'identity_document' => 'V-17.452.881',
                'department' => 'Tecnología Educativa',
                'academic_title' => 'Especialista en Tecnología Educativa',
                'subject' => 'TIC I',
            ],
        ];

        foreach ($professors as $professorData) {
            $user = User::query()->updateOrCreate(
                ['email' => $professorData['email']],
                [
                    'name' => $professorData['name'],
                    'password' => self::DEMO_PASSWORD,
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ],
            );
            $this->assignExistingRoles($user, [RoleEnum::Profesor]);

            $profile = $this->createProfessorProfile($user, $professorData);

            $this->assignTaughtSubject($profile, $career, $professorData['subject']);
        }
    }
}
