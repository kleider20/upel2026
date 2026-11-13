<?php

namespace App\Http\Controllers;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\ProfessorProfile;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Support\AdminModuleCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Panel principal del portal administrativo.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->portalRole();

        $modules = collect(AdminModuleCatalog::all())
            ->filter(static fn (array $module): bool => $user->can($module['permission']))
            ->map(static fn (array $module, string $key): array => [
                'key' => $key,
                ...$module,
                'href' => match ($key) {
                    'subjects' => route('admin.subjects.index'),
                    'pensums' => route('admin.pensums.index'),
                    'schedules' => route('admin.schedules.index'),
                    'careers' => route('admin.careers.index'),
                    'professors' => route('admin.professors.index'),
                    default => route('admin.module', ['module' => $key]),
                },
            ])
            ->values();

        return Inertia::render('admin/dashboard', [
            'role' => $role?->label(),
            'role_key' => $role?->value,
            'role_description' => $role?->description(),
            'permissions_count' => $user->getAllPermissions()->count(),
            'summary' => $this->summary($user),
            'modules' => $modules,
            'pensums' => $this->pensums($user),
            'can_manage_pensums' => $user->can(PermissionEnum::SubjectsManage->value),
            'active_period' => AcademicPeriod::query()->where('is_active', true)->value('name'),
        ]);
    }

    /**
     * Carreras con su avance de pensum para el panel administrativo.
     *
     * @return array<int, array{id: int, name: string, code: string, icon: string, subjects_count: int, url: string}>
     */
    private function pensums(User $user): array
    {
        if (! $user->can(PermissionEnum::SubjectsView->value)) {
            return [];
        }

        return Career::query()
            ->withCount('subjects')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'icon'])
            ->map(static fn (Career $career): array => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'icon' => $career->icon ?? '🎓',
                'subjects_count' => $career->subjects_count,
                'url' => route('admin.pensums.show', ['career' => $career->code]),
            ])
            ->values()
            ->all();
    }

    /**
     * Construye las tarjetas de resumen según los permisos del usuario.
     *
     * @return array<int, array{label: string, value: string, hint: string, tone: string, icon: string}>
     */
    private function summary(User $user): array
    {
        $cards = [];

        if ($user->can(PermissionEnum::StudentsView->value)) {
            $cards[] = [
                'label' => 'Estudiantes activos',
                'value' => (string) StudentProfile::query()->where('status', 'activo')->count(),
                'hint' => StudentProfile::query()->count().' expedientes registrados',
                'tone' => 'blue',
                'icon' => 'users',
            ];
        }

        if ($user->can(PermissionEnum::ProfessorsView->value)) {
            $cards[] = [
                'label' => 'Profesores',
                'value' => (string) ProfessorProfile::query()->count(),
                'hint' => 'Plantilla docente registrada',
                'tone' => 'green',
                'icon' => 'graduation-cap',
            ];
        }

        if ($user->can(PermissionEnum::CareersView->value)) {
            $cards[] = [
                'label' => 'Carreras',
                'value' => (string) Career::query()->count(),
                'hint' => Subject::query()->count().' materias en el sistema',
                'tone' => 'navy',
                'icon' => 'library',
            ];
        }

        if ($user->can(PermissionEnum::GradesView->value)) {
            $average = Enrollment::query()->whereNotNull('final_grade')->avg('final_grade');

            $cards[] = [
                'label' => 'Promedio institucional',
                'value' => $average !== null ? number_format((float) $average, 1, ',', '.').' / 10' : '—',
                'hint' => Enrollment::query()->whereNotNull('final_grade')->count().' notas registradas',
                'tone' => 'gold',
                'icon' => 'clipboard-list',
            ];
        }

        if ($user->can(PermissionEnum::FinanceView->value)) {
            $collected = Payment::query()->where('status', 'pagado')->sum('amount');
            $pending = Payment::query()->whereIn('status', ['pendiente', 'vencido'])->sum('amount');

            $cards[] = [
                'label' => 'Recaudado',
                'value' => '$ '.number_format((float) $collected, 2, ',', '.'),
                'hint' => '$ '.number_format((float) $pending, 2, ',', '.').' por cobrar',
                'tone' => 'green',
                'icon' => 'wallet',
            ];
        }

        if ($user->can(PermissionEnum::UsersView->value)) {
            $cards[] = [
                'label' => 'Usuarios del sistema',
                'value' => (string) User::query()->count(),
                'hint' => User::query()->role(RoleEnum::Admin->value)->count().' administradores',
                'tone' => 'slate',
                'icon' => 'user-cog',
            ];
        }

        return $cards;
    }
}
