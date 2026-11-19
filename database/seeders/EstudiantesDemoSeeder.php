<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use Database\Seeders\Concerns\ManagesStudentProfiles;
use Database\Seeders\Concerns\ResolvesAcademicEntities;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;

class EstudiantesDemoSeeder extends Seeder
{
    use ManagesStudentProfiles, ResolvesAcademicEntities, SyncsRolePermissions;

    /**
     * Contraseña compartida por los estudiantes de prueba.
     */
    public const DEMO_PASSWORD = 'Estudiante12345!';

    /**
     * Crea estudiantes de prueba con su perfil en la carrera de Educación Primaria.
     */
    public function run(): void
    {
        $career = $this->getCareer('EDPRI');

        $students = [
            [
                'name' => 'María Fernanda Pérez',
                'email' => 'estudiante.demo1@upel.edu.ve',
                'student_code' => 'EST-DEMO-001',
                'current_semester' => 5,
            ],
            [
                'name' => 'José Luis Rodríguez',
                'email' => 'estudiante.demo2@upel.edu.ve',
                'student_code' => 'EST-DEMO-002',
                'current_semester' => 6,
            ],
            [
                'name' => 'Ana Gabriela Martínez',
                'email' => 'estudiante.demo3@upel.edu.ve',
                'student_code' => 'EST-DEMO-003',
                'current_semester' => 7,
            ],
        ];

        foreach ($students as $student) {
            $user = $this->createUserWithRole(
                $student['name'],
                $student['email'],
                self::DEMO_PASSWORD,
                RoleEnum::Estudiante,
            );

            $this->createStudentProfile(
                $user,
                $career,
                $student['student_code'],
                $student['current_semester'],
            );
        }
    }
}
