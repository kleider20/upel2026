<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\ProfessorProfile;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    /**
     * Crea usuarios de prueba para cada portal y datos académicos de ejemplo.
     */
    public function run(): void
    {
        $admin = $this->user('Administrador UPEL', 'admin@upel.edu.ve', 'Admin12345!', Role::Admin);
        $this->user('Decana Académica', 'decano@upel.edu.ve', 'Decano12345!', Role::Decano);
        $this->user('Coordinador Académico', 'coordinador@upel.edu.ve', 'Coordinador12345!', Role::CoordinadorAcademico);
        $this->user('Personal Administrativo', 'administrativo@upel.edu.ve', 'Administrativo12345!', Role::PersonalAdministrativo);

        $primaria = Career::where('code', 'EDPRI')->firstOrFail();
        $lengua = Career::where('code', 'LENLI')->firstOrFail();
        $period2025 = AcademicPeriod::where('name', '2025-II')->firstOrFail();
        $period2026I = AcademicPeriod::where('name', '2026-I')->firstOrFail();
        $period2026II = AcademicPeriod::where('name', '2026-II')->firstOrFail();

        $professor = $this->user(
            'Dra. Carmen Alicia Rojas',
            'profesor@upel.edu.ve',
            'Profesor12345!',
            Role::Profesor,
        );

        ProfessorProfile::updateOrCreate(
            ['user_id' => $professor->id],
            [
                'employee_code' => 'PROF-001',
                'department' => 'Pedagogía',
                'academic_title' => 'Doctora en Educación',
            ],
        );

        $student = $this->user(
            'María Fernanda Pérez',
            'estudiante@upel.edu.ve',
            'Estudiante12345!',
            Role::Estudiante,
        );

        $this->studentProfile($student, $primaria, 'EST-2021-001', 5, 'activo', 2021);

        $otherStudents = [
            ['José Luis Rodríguez', 'estudiante2@upel.edu.ve', 'EST-2021-002', 8.5, 9.0],
            ['Ana Gabriela Martínez', 'estudiante3@upel.edu.ve', 'EST-2021-003', 7.5, 8.8],
            ['Carlos Andrés Sánchez', 'estudiante4@upel.edu.ve', 'EST-2021-004', 9.2, 8.4],
            ['Daniela Valentina Torres', 'estudiante5@upel.edu.ve', 'EST-2021-005', null, null],
            ['Luis Miguel Herrera', 'estudiante6@upel.edu.ve', 'EST-2021-006', null, null],
            ['Sofía Isabel Ramírez', 'estudiante7@upel.edu.ve', 'EST-2021-007', null, null],
        ];

        $evaluacion = $this->subject($primaria, 'Evaluación del Aprendizaje');
        $didacticaLectura = $this->subject($primaria, 'Didáctica de la Lectura y Escritura');

        $professor->taughtSubjects()->syncWithoutDetaching([
            $evaluacion->id,
            $didacticaLectura->id,
        ]);

        $this->enroll($student, $this->subject($primaria, 'Fundamentos de la Educación Primaria'), $period2025, null, 9.0);
        $this->enroll($student, $this->subject($primaria, 'Introducción al Estudio de la Lengua'), $period2025, null, 8.5);
        $this->enroll($student, $this->subject($primaria, 'Sociedad y Educación'), $period2025, null, 9.5);
        $this->enroll($student, $this->subject($primaria, 'Aprendizaje Matemático I'), $period2026I, null, 7.8);
        $this->enroll($student, $this->subject($primaria, 'Didáctica General'), $period2026I, null, 8.2);
        $this->enroll($student, $this->subject($primaria, 'Ciencias Naturales'), $period2026I, null, 9.1);
        $this->enroll($student, $this->subject($primaria, 'Historia de Venezuela y Ciudadanía'), $period2026II, null, 6.5);
        $this->enroll($student, $evaluacion, $period2026II, $professor, null);
        $this->enroll($student, $didacticaLectura, $period2026II, $professor, null);

        foreach ($otherStudents as [$name, $email, $code, $evaluacionGrade, $lecturaGrade]) {
            $otherStudent = $this->user($name, $email, 'Estudiante12345!', Role::Estudiante);
            $this->studentProfile($otherStudent, $primaria, $code, 5, 'activo', 2021);
            $this->enroll($otherStudent, $evaluacion, $period2026II, $professor, $evaluacionGrade);
            $this->enroll($otherStudent, $didacticaLectura, $period2026II, $professor, $lecturaGrade);
        }

        $graduate = $this->user(
            'Pedro José González',
            'graduado@upel.edu.ve',
            'Graduado12345!',
            Role::Graduado,
        );

        $this->studentProfile($graduate, $lengua, 'GRA-2016-001', 8, 'egresado', 2016, 2021);

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
            $this->enroll($graduate, $this->subject($lengua, $subjectName), $period2025, null, $grade);
        }

        $this->payments($student);
        $this->payments(User::where('email', 'estudiante2@upel.edu.ve')->firstOrFail());

        // Evita que queden períodos activos duplicados si el seeder se ejecuta varias veces.
        AcademicPeriod::where('name', '!=', '2026-II')->update(['is_active' => false]);
        AcademicPeriod::where('name', '2026-II')->update(['is_active' => true]);
    }

    /**
     * Crea o actualiza un usuario y le asigna un único rol.
     */
    private function user(string $name, string $email, string $password, Role $role): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        $user->syncRoles([$role->value]);

        return $user;
    }

    private function studentProfile(
        User $user,
        Career $career,
        string $code,
        int $semester,
        string $status,
        ?int $admissionYear = null,
        ?int $graduationYear = null,
    ): StudentProfile {
        return StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'career_id' => $career->id,
                'student_code' => $code,
                'current_semester' => $semester,
                'status' => $status,
                'admission_year' => $admissionYear,
                'graduation_year' => $graduationYear,
            ],
        );
    }

    private function subject(Career $career, string $name): Subject
    {
        return Subject::where('career_id', $career->id)
            ->where('name', $name)
            ->firstOrFail();
    }

    private function enroll(
        User $student,
        Subject $subject,
        AcademicPeriod $period,
        ?User $professor,
        ?float $grade,
    ): Enrollment {
        $status = match (true) {
            $grade === null => 'cursando',
            $grade >= Subject::PASSING_GRADE => 'aprobado',
            default => 'reprobado',
        };

        return Enrollment::updateOrCreate(
            [
                'student_id' => $student->id,
                'subject_id' => $subject->id,
                'academic_period_id' => $period->id,
            ],
            [
                'professor_id' => $professor?->id,
                'status' => $status,
                'final_grade' => $grade,
                'grade_updated_at' => $grade !== null ? now() : null,
            ],
        );
    }

    private function payments(User $student): void
    {
        $payments = [
            ['Inscripción semestral 2026-II', 25.00, 'pagado', '2026-09-10', '2026-09-08'],
            ['Mensualidad septiembre 2026', 45.00, 'pagado', '2026-09-30', '2026-09-28'],
            ['Mensualidad octubre 2026', 45.00, 'pendiente', '2026-10-31', null],
            ['Mensualidad noviembre 2026', 45.00, 'pendiente', '2026-11-30', null],
        ];

        foreach ($payments as [$concept, $amount, $status, $dueDate, $paidAt]) {
            Payment::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'concept' => $concept,
                    'due_date' => $dueDate,
                ],
                [
                    'amount' => $amount,
                    'status' => $status,
                    'paid_at' => $paidAt,
                ],
            );
        }
    }
}
