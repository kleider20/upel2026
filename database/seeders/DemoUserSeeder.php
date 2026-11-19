<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\AcademicPeriod;
use App\Models\User;
use Database\Seeders\Concerns\ManagesEnrollments;
use Database\Seeders\Concerns\ManagesPayments;
use Database\Seeders\Concerns\ManagesProfessorProfiles;
use Database\Seeders\Concerns\ManagesStudentProfiles;
use Database\Seeders\Concerns\ResolvesAcademicEntities;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    use ManagesEnrollments, ManagesPayments, ManagesProfessorProfiles, ManagesStudentProfiles, ResolvesAcademicEntities, SyncsRolePermissions;

    /**
     * Crea usuarios de prueba para cada portal y datos académicos de ejemplo.
     */
    public function run(): void
    {
        $admin = $this->createUserWithRole('Administrador UPEL', 'admin@upel.edu.ve', 'Admin12345!', RoleEnum::Admin);
        $this->createUserWithRole('Decana Académica', 'decano@upel.edu.ve', 'Decano12345!', RoleEnum::Decano);
        $this->createUserWithRole(
            'Coordinador Académico',
            'coordinador@upel.edu.ve',
            'Coordinador12345!',
            RoleEnum::CoordinadorAcademico,
        );
        $this->createUserWithRole(
            'Personal Administrativo',
            'administrativo@upel.edu.ve',
            'Administrativo12345!',
            RoleEnum::PersonalAdministrativo,
        );

        $primaria = $this->getCareer('EDPRI');
        $lengua = $this->getCareer('LENLI');
        $period2025 = $this->getAcademicPeriod('2025-II');
        $period2026I = $this->getAcademicPeriod('2026-I');
        $period2026II = $this->getAcademicPeriod('2026-II');

        $professor = $this->createUserWithRole(
            'Dra. Carmen Alicia Rojas',
            'profesor@upel.edu.ve',
            'Profesor12345!',
            RoleEnum::Profesor,
        );

        $this->createProfessorProfile($professor, [
            'employee_code' => 'PROF-001',
            'identity_document' => 'V-11.245.830',
            'department' => 'Pedagogía',
            'academic_title' => 'Doctora en Educación',
        ]);

        $student = $this->createUserWithRole(
            'María Fernanda Pérez',
            'estudiante@upel.edu.ve',
            'Estudiante12345!',
            RoleEnum::Estudiante,
        );

        $this->createStudentProfile($student, $primaria, 'EST-2021-001', 5, 'activo', 2021);

        $otherStudents = [
            ['José Luis Rodríguez', 'estudiante2@upel.edu.ve', 'EST-2021-002', 8.5, 9.0],
            ['Ana Gabriela Martínez', 'estudiante3@upel.edu.ve', 'EST-2021-003', 7.5, 8.8],
            ['Carlos Andrés Sánchez', 'estudiante4@upel.edu.ve', 'EST-2021-004', 9.2, 8.4],
            ['Daniela Valentina Torres', 'estudiante5@upel.edu.ve', 'EST-2021-005', null, null],
            ['Luis Miguel Herrera', 'estudiante6@upel.edu.ve', 'EST-2021-006', null, null],
            ['Sofía Isabel Ramírez', 'estudiante7@upel.edu.ve', 'EST-2021-007', null, null],
        ];

        $evaluacion = $this->getSubject($primaria, 'Evaluación del Aprendizaje');
        $didacticaLectura = $this->getSubject($primaria, 'Didáctica de la Lectura y Escritura');

        $professor->taughtSubjects()->syncWithoutDetaching([
            $evaluacion->id,
            $didacticaLectura->id,
        ]);

        $this->enrollStudent($student, $this->getSubject($primaria, 'Fundamentos de la Educación Primaria'), $period2025, null, 9.0);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Introducción al Estudio de la Lengua'), $period2025, null, 8.5);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Sociedad y Educación'), $period2025, null, 9.5);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Aprendizaje Matemático I'), $period2026I, null, 7.8);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Didáctica General'), $period2026I, null, 8.2);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Ciencias Naturales'), $period2026I, null, 9.1);
        $this->enrollStudent($student, $this->getSubject($primaria, 'Historia de Venezuela y Ciudadanía'), $period2026II, null, 6.5);
        $this->enrollStudent($student, $evaluacion, $period2026II, $professor, null);
        $this->enrollStudent($student, $didacticaLectura, $period2026II, $professor, null);

        foreach ($otherStudents as [$name, $email, $code, $evaluacionGrade, $lecturaGrade]) {
            $otherStudent = $this->createUserWithRole($name, $email, 'Estudiante12345!', RoleEnum::Estudiante);
            $this->createStudentProfile($otherStudent, $primaria, $code, 5, 'activo', 2021);
            $this->enrollStudent($otherStudent, $evaluacion, $period2026II, $professor, $evaluacionGrade);
            $this->enrollStudent($otherStudent, $didacticaLectura, $period2026II, $professor, $lecturaGrade);
        }

        $graduate = $this->createUserWithRole(
            'Pedro José González',
            'graduado@upel.edu.ve',
            'Graduado12345!',
            RoleEnum::Graduado,
        );

        $this->createStudentProfile($graduate, $lengua, 'GRA-2016-001', 8, 'egresado', 2016, 2021);

        $graduateGrades = [
            'Introducción a los Estudios de la Lengua' => 9.0,
            'Cultura y Discurso Literario' => 8.7,
            'Tendencias de la Lingüística' => 8.5,
            'Gramática' => 9.2,
            'Literatura Venezolana' => 8.8,
            'Literatura Latinoamericana y Caribeña' => 9.4,
            'Latín' => 8.0,
            'Español de Venezuela' => 9.1,
        ];

        foreach ($graduateGrades as $subjectName => $grade) {
            $this->enrollStudent($graduate, $this->getSubject($lengua, $subjectName), $period2025, null, $grade);
        }

        $this->seedDemoPayments($student);
        $this->seedDemoPayments(User::where('email', 'estudiante2@upel.edu.ve')->firstOrFail());

        // Evita que queden períodos activos duplicados si el seeder se ejecuta varias veces.
        AcademicPeriod::where('name', '!=', '2026-II')->update(['is_active' => false]);
        AcademicPeriod::where('name', '2026-II')->update(['is_active' => true]);
    }
}
