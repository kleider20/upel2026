<?php

namespace App\Http\Controllers;

use App\Enums\Role as RoleEnum;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\ProfessorProfile;
use App\Models\Program;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Support\AdminModuleCatalog;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Spatie\Permission\Models\Role as SpatieRole;

class AdminModuleController extends Controller
{
    /**
     * Muestra el listado del módulo administrativo solicitado.
     */
    public function index(Request $request, string $module): Response
    {
        $definition = AdminModuleCatalog::get($module);

        if ($definition === null) {
            abort(404);
        }

        abort_unless(
            $request->user()?->can($definition['permission']),
            403,
            'No tienes permiso para acceder a este módulo.',
        );

        $data = match ($module) {
            'students' => $this->students(),
            'professors' => $this->professors(),
            'careers' => $this->careers(),
            'subjects' => $this->subjects(),
            'grades' => $this->grades(),
            'finance' => $this->finance(),
            'programs' => $this->programs(),
            'users' => $this->users(),
            'roles' => $this->roles(),
            default => abort(404),
        };

        return Inertia::render('admin/resource', [
            'module' => $module,
            'title' => $definition['title'],
            'description' => $definition['description'],
            'columns' => $data['columns'],
            'rows' => $data['rows'],
            'stats' => $data['stats'],
        ]);
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function students(): array
    {
        $profiles = StudentProfile::query()
            ->with(['user', 'career'])
            ->withAvg('enrollments as average_grade', 'final_grade')
            ->orderBy('student_code')
            ->get();

        $average = Enrollment::query()->whereNotNull('final_grade')->avg('final_grade');

        return [
            'columns' => [
                ['key' => 'student', 'label' => 'Estudiante'],
                ['key' => 'code', 'label' => 'Código'],
                ['key' => 'career', 'label' => 'Carrera'],
                ['key' => 'semester', 'label' => 'Semestre'],
                ['key' => 'status', 'label' => 'Estado'],
                ['key' => 'average', 'label' => 'Promedio'],
            ],
            'rows' => $profiles->map(static fn (StudentProfile $profile): array => [
                'id' => $profile->id,
                'cells' => [
                    'student' => $profile->user?->name ?? '—',
                    'code' => $profile->student_code,
                    'career' => $profile->career?->name ?? '—',
                    'semester' => (string) $profile->current_semester,
                    'status' => $profile->statusLabel(),
                    'average' => $profile->average_grade !== null
                        ? number_format((float) $profile->average_grade, 1, ',', '.').' / 10'
                        : 'Sin notas',
                ],
                'tones' => ['status' => $profile->statusTone()],
            ])->values(),
            'stats' => [
                ['label' => 'Expedientes', 'value' => (string) $profiles->count(), 'tone' => 'blue'],
                ['label' => 'Activos', 'value' => (string) $profiles->where('status', 'activo')->count(), 'tone' => 'green'],
                ['label' => 'Egresados', 'value' => (string) $profiles->where('status', 'egresado')->count(), 'tone' => 'navy'],
                ['label' => 'Promedio general', 'value' => $average !== null ? number_format((float) $average, 1, ',', '.').' / 10' : '—', 'tone' => 'gold'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function professors(): array
    {
        $profiles = ProfessorProfile::query()
            ->with('user')
            ->withCount('subjects')
            ->orderBy('employee_code')
            ->get();

        return [
            'columns' => [
                ['key' => 'professor', 'label' => 'Profesor'],
                ['key' => 'code', 'label' => 'Código'],
                ['key' => 'department', 'label' => 'Departamento'],
                ['key' => 'title', 'label' => 'Título académico'],
                ['key' => 'subjects', 'label' => 'Materias'],
            ],
            'rows' => $profiles->map(static fn (ProfessorProfile $profile): array => [
                'id' => $profile->id,
                'cells' => [
                    'professor' => $profile->user?->name ?? '—',
                    'code' => $profile->employee_code,
                    'department' => $profile->department ?? '—',
                    'title' => $profile->academic_title ?? '—',
                    'subjects' => (string) $profile->subjects_count,
                ],
            ])->values(),
            'stats' => [
                ['label' => 'Profesores', 'value' => (string) $profiles->count(), 'tone' => 'blue'],
                ['label' => 'Departamentos', 'value' => (string) $profiles->pluck('department')->filter()->unique()->count(), 'tone' => 'navy'],
                ['label' => 'Materias asignadas', 'value' => (string) DB::table('professor_subjects')->count(), 'tone' => 'gold'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function careers(): array
    {
        $careers = Career::query()
            ->withCount(['subjects', 'studentProfiles'])
            ->orderBy('name')
            ->get();

        return [
            'columns' => [
                ['key' => 'career', 'label' => 'Carrera'],
                ['key' => 'code', 'label' => 'Código'],
                ['key' => 'modality', 'label' => 'Modalidad'],
                ['key' => 'duration', 'label' => 'Duración'],
                ['key' => 'subjects', 'label' => 'Materias'],
                ['key' => 'students', 'label' => 'Estudiantes'],
            ],
            'rows' => $careers->map(static fn (Career $career): array => [
                'id' => $career->id,
                'cells' => [
                    'career' => $career->name,
                    'code' => $career->code,
                    'modality' => $career->modalityLabel(),
                    'duration' => $career->duration_semesters.' periodos',
                    'subjects' => (string) $career->subjects_count,
                    'students' => (string) $career->student_profiles_count,
                ],
            ])->values(),
            'stats' => [
                ['label' => 'Carreras', 'value' => (string) $careers->count(), 'tone' => 'blue'],
                ['label' => 'Activas', 'value' => (string) $careers->where('is_active', true)->count(), 'tone' => 'green'],
                ['label' => 'Materias', 'value' => (string) $careers->sum('subjects_count'), 'tone' => 'gold'],
                ['label' => 'Estudiantes', 'value' => (string) $careers->sum('student_profiles_count'), 'tone' => 'navy'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function subjects(): array
    {
        $subjects = Subject::query()
            ->with('career')
            ->withCount(['professors', 'enrollments'])
            ->orderBy('career_id')
            ->orderBy('semester')
            ->get();

        return [
            'columns' => [
                ['key' => 'subject', 'label' => 'Materia'],
                ['key' => 'code', 'label' => 'Código'],
                ['key' => 'career', 'label' => 'Carrera'],
                ['key' => 'semester', 'label' => 'Periodo'],
                ['key' => 'credits', 'label' => 'Créditos'],
                ['key' => 'professors', 'label' => 'Profesores'],
                ['key' => 'enrollments', 'label' => 'Inscritos'],
            ],
            'rows' => $subjects->map(static fn (Subject $subject): array => [
                'id' => $subject->id,
                'cells' => [
                    'subject' => $subject->name,
                    'code' => $subject->code,
                    'career' => $subject->career?->name ?? '—',
                    'semester' => (string) $subject->semester,
                    'credits' => (string) $subject->credits,
                    'professors' => (string) $subject->professors_count,
                    'enrollments' => (string) $subject->enrollments_count,
                ],
            ])->values(),
            'stats' => [
                ['label' => 'Materias', 'value' => (string) $subjects->count(), 'tone' => 'blue'],
                ['label' => 'Créditos', 'value' => (string) $subjects->sum('credits'), 'tone' => 'gold'],
                ['label' => 'Inscripciones', 'value' => (string) $subjects->sum('enrollments_count'), 'tone' => 'green'],
                ['label' => 'Asignaciones docentes', 'value' => (string) DB::table('professor_subjects')->count(), 'tone' => 'navy'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function grades(): array
    {
        $enrollments = Enrollment::query()
            ->with(['student', 'subject.career', 'academicPeriod'])
            ->orderByDesc('academic_period_id')
            ->orderBy('student_id')
            ->get();

        $graded = $enrollments->whereNotNull('final_grade');
        $average = $graded->avg('final_grade');

        return [
            'columns' => [
                ['key' => 'student', 'label' => 'Estudiante'],
                ['key' => 'subject', 'label' => 'Materia'],
                ['key' => 'career', 'label' => 'Carrera'],
                ['key' => 'period', 'label' => 'Período'],
                ['key' => 'grade', 'label' => 'Nota'],
                ['key' => 'status', 'label' => 'Estado'],
            ],
            'rows' => $enrollments->map(static fn (Enrollment $enrollment): array => [
                'id' => $enrollment->id,
                'cells' => [
                    'student' => $enrollment->student?->name ?? '—',
                    'subject' => $enrollment->subject?->name ?? '—',
                    'career' => $enrollment->subject?->career?->name ?? '—',
                    'period' => $enrollment->academicPeriod?->name ?? '—',
                    'grade' => $enrollment->final_grade !== null
                        ? number_format((float) $enrollment->final_grade, 1, ',', '.').' / 10'
                        : 'Sin nota',
                    'status' => $enrollment->statusLabel(),
                ],
                'tones' => ['status' => $enrollment->statusTone()],
            ])->values(),
            'stats' => [
                ['label' => 'Registros', 'value' => (string) $enrollments->count(), 'tone' => 'blue'],
                ['label' => 'Promedio', 'value' => $average !== null ? number_format((float) $average, 1, ',', '.').' / 10' : '—', 'tone' => 'gold'],
                ['label' => 'Aprobadas', 'value' => (string) $enrollments->where('status', 'aprobado')->count(), 'tone' => 'green'],
                ['label' => 'Sin nota', 'value' => (string) $enrollments->whereNull('final_grade')->count(), 'tone' => 'amber'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function finance(): array
    {
        $payments = Payment::query()
            ->with('student')
            ->orderByDesc('due_date')
            ->get();

        $collected = $payments->where('status', 'pagado')->sum('amount');
        $pending = $payments->whereIn('status', ['pendiente', 'vencido'])->sum('amount');

        return [
            'columns' => [
                ['key' => 'student', 'label' => 'Estudiante'],
                ['key' => 'concept', 'label' => 'Concepto'],
                ['key' => 'amount', 'label' => 'Monto'],
                ['key' => 'status', 'label' => 'Estado'],
                ['key' => 'due_date', 'label' => 'Vence'],
                ['key' => 'paid_at', 'label' => 'Pagado'],
            ],
            'rows' => $payments->map(static fn (Payment $payment): array => [
                'id' => $payment->id,
                'cells' => [
                    'student' => $payment->student?->name ?? '—',
                    'concept' => $payment->concept,
                    'amount' => '$ '.number_format((float) $payment->amount, 2, ',', '.'),
                    'status' => $payment->statusLabel(),
                    'due_date' => self::date($payment->due_date),
                    'paid_at' => self::date($payment->paid_at),
                ],
                'tones' => ['status' => $payment->statusTone()],
            ])->values(),
            'stats' => [
                ['label' => 'Recaudado', 'value' => '$ '.number_format((float) $collected, 2, ',', '.'), 'tone' => 'green'],
                ['label' => 'Por cobrar', 'value' => '$ '.number_format((float) $pending, 2, ',', '.'), 'tone' => 'amber'],
                ['label' => 'Pagos registrados', 'value' => (string) $payments->count(), 'tone' => 'blue'],
                ['label' => 'Vencidos', 'value' => (string) $payments->where('status', 'vencido')->count(), 'tone' => 'red'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function programs(): array
    {
        $programs = Program::query()->orderBy('type')->orderBy('name')->get();
        $postgraduateTypes = ['especializacion', 'maestria', 'doctorado'];
        $courseTypes = ['curso', 'taller'];

        return [
            'columns' => [
                ['key' => 'program', 'label' => 'Programa'],
                ['key' => 'type', 'label' => 'Tipo'],
                ['key' => 'modality', 'label' => 'Modalidad'],
                ['key' => 'duration', 'label' => 'Duración'],
                ['key' => 'status', 'label' => 'Estado'],
            ],
            'rows' => $programs->map(static fn (Program $program): array => [
                'id' => $program->id,
                'cells' => [
                    'program' => $program->name,
                    'type' => $program->typeLabel(),
                    'modality' => $program->modalityLabel(),
                    'duration' => $program->duration ?? '—',
                    'status' => $program->is_active ? 'Activo' : 'Inactivo',
                ],
                'tones' => ['status' => $program->is_active ? 'green' : 'slate'],
            ])->values(),
            'stats' => [
                ['label' => 'Programas', 'value' => (string) $programs->count(), 'tone' => 'blue'],
                ['label' => 'Postgrados', 'value' => (string) $programs->whereIn('type', $postgraduateTypes)->count(), 'tone' => 'navy'],
                ['label' => 'Cursos y talleres', 'value' => (string) $programs->whereIn('type', $courseTypes)->count(), 'tone' => 'gold'],
                ['label' => 'Activos', 'value' => (string) $programs->where('is_active', true)->count(), 'tone' => 'green'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function users(): array
    {
        $users = User::query()->with('roles')->orderBy('name')->get();

        return [
            'columns' => [
                ['key' => 'name', 'label' => 'Nombre'],
                ['key' => 'email', 'label' => 'Correo'],
                ['key' => 'roles', 'label' => 'Roles'],
                ['key' => 'verified', 'label' => 'Verificado'],
                ['key' => 'created', 'label' => 'Registro'],
            ],
            'rows' => $users->map(static fn (User $user): array => [
                'id' => $user->id,
                'cells' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()
                        ->map(static fn (string $role): string => RoleEnum::tryFrom($role)?->label() ?? $role)
                        ->implode(', ') ?: 'Sin rol',
                    'verified' => $user->email_verified_at !== null ? 'Sí' : 'No',
                    'created' => self::date($user->created_at),
                ],
                'tones' => ['verified' => $user->email_verified_at !== null ? 'green' : 'amber'],
            ])->values(),
            'stats' => [
                ['label' => 'Usuarios', 'value' => (string) $users->count(), 'tone' => 'blue'],
                ['label' => 'Verificados', 'value' => (string) $users->whereNotNull('email_verified_at')->count(), 'tone' => 'green'],
                ['label' => 'Administradores', 'value' => (string) $users->filter(static fn (User $user): bool => $user->hasAnyRole(RoleEnum::adminPortalValues()))->count(), 'tone' => 'navy'],
                ['label' => 'Estudiantes', 'value' => (string) $users->filter(static fn (User $user): bool => $user->isStudent())->count(), 'tone' => 'gold'],
            ],
        ];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string}>, rows: mixed, stats: array<int, array<string, string>>}
     */
    private function roles(): array
    {
        $roles = SpatieRole::query()
            ->with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get();

        return [
            'columns' => [
                ['key' => 'role', 'label' => 'Rol'],
                ['key' => 'permissions', 'label' => 'Permisos'],
                ['key' => 'users', 'label' => 'Usuarios'],
                ['key' => 'scope', 'label' => 'Alcance'],
            ],
            'rows' => $roles->map(static fn (SpatieRole $role): array => [
                'id' => $role->id,
                'cells' => [
                    'role' => RoleEnum::tryFrom($role->name)?->label() ?? $role->name,
                    'permissions' => (string) $role->permissions->count(),
                    'users' => (string) $role->users_count,
                    'scope' => RoleEnum::tryFrom($role->name)?->description() ?? 'Rol del sistema',
                ],
            ])->values(),
            'stats' => [
                ['label' => 'Roles', 'value' => (string) $roles->count(), 'tone' => 'blue'],
                ['label' => 'Permisos', 'value' => (string) SpatiePermission::query()->count(), 'tone' => 'gold'],
                ['label' => 'Asignaciones', 'value' => (string) DB::table('model_has_roles')->count(), 'tone' => 'green'],
                ['label' => 'Roles administrativos', 'value' => (string) $roles->filter(static fn (SpatieRole $role): bool => RoleEnum::tryFrom($role->name)?->isAdminPortal() ?? false)->count(), 'tone' => 'navy'],
            ],
        ];
    }

    /**
     * Formatea una fecha para las tablas administrativas.
     */
    private static function date(?CarbonInterface $date): string
    {
        return $date?->format('d/m/Y') ?? '—';
    }
}
