<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Enums\Role;
use App\Http\Requests\ProfessorRequest;
use App\Models\ProfessorProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminProfessorController extends Controller
{
    /**
     * Lista profesores, sus materias asignadas y los permisos de gestión.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $search = trim($request->string('search')->toString());
        $canManage = $request->user()?->can(Permission::ProfessorsManage->value) ?? false;
        $canDelete = $request->user()?->can(Permission::ProfessorsDelete->value) ?? false;
        $professors = ProfessorProfile::query()
            ->with(['user:id,name,email', 'subjects.career:id,name,code'])
            ->withCount('subjects')
            ->when(
                $search !== '',
                static fn ($query) => $query->where(static function ($query) use ($search): void {
                    $query
                        ->where('employee_code', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%")
                        ->orWhere('academic_title', 'like', "%{$search}%")
                        ->orWhereHas('user', static fn ($query) => $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('subjects', static fn ($query) => $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%"));
                }),
            )
            ->orderBy('employee_code')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (ProfessorProfile $professor): array => [
                'id' => $professor->id,
                'name' => $professor->user->name,
                'email' => $professor->user->email,
                'employee_code' => $professor->employee_code,
                'department' => $professor->department,
                'academic_title' => $professor->academic_title,
                'subjects_count' => $professor->subjects_count,
                'subjects' => $professor->subjects
                    ->map(static fn (Subject $subject): array => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'career' => $subject->career->name,
                        'career_code' => $subject->career->code,
                        'semester' => $subject->semester,
                    ])
                    ->values()
                    ->all(),
                'edit_url' => $canManage ? route('admin.professors.edit', $professor) : null,
                'show_url' => route('admin.professors.show', $professor),
                'delete_url' => $canDelete ? route('admin.professors.destroy', $professor) : null,
            ]);

        return Inertia::render('admin/professors/index', [
            'professors' => $professors,
            'filters' => ['search' => $search !== '' ? $search : null],
            'stats' => [
                ['label' => 'Profesores', 'value' => (string) ProfessorProfile::query()->count(), 'tone' => 'blue'],
                ['label' => 'Departamentos', 'value' => (string) ProfessorProfile::query()
                    ->whereNotNull('department')
                    ->distinct()
                    ->count('department'), 'tone' => 'navy'],
                ['label' => 'Materias asignadas', 'value' => (string) DB::table('professor_subjects')->count(), 'tone' => 'gold'],
            ],
            'can_manage' => $canManage,
            'can_delete' => $canDelete,
        ]);
    }

    /**
     * Muestra el perfil docente y las materias que tiene asignadas.
     */
    public function show(Request $request, ProfessorProfile $professor): Response
    {
        $this->authorizeView($request);

        $canManage = $request->user()?->can(Permission::ProfessorsManage->value) ?? false;
        $canDelete = $request->user()?->can(Permission::ProfessorsDelete->value) ?? false;

        $professor->load([
            'user:id,name,email,email_verified_at,must_change_password,created_at',
            'subjects.career:id,name,code',
        ]);

        return Inertia::render('admin/professors/show', [
            'professor' => [
                'id' => $professor->id,
                'name' => $professor->user->name,
                'email' => $professor->user->email,
                'employee_code' => $professor->employee_code,
                'department' => $professor->department,
                'academic_title' => $professor->academic_title,
                'must_change_password' => $professor->user->must_change_password,
                'email_verified' => $professor->user->email_verified_at !== null,
                'registered_at' => $professor->user->created_at?->format('d/m/Y'),
                'subjects_count' => $professor->subjects->count(),
                'schedules_count' => DB::table('schedule_subjects')
                    ->where('professor_id', $professor->user_id)
                    ->count(),
                'subjects' => $professor->subjects
                    ->sortBy([
                        static fn (Subject $a, Subject $b): int => $a->career->name <=> $b->career->name,
                        static fn (Subject $a, Subject $b): int => $a->semester <=> $b->semester,
                        static fn (Subject $a, Subject $b): int => $a->name <=> $b->name,
                    ])
                    ->map(static fn (Subject $subject): array => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'career' => $subject->career->name,
                        'career_code' => $subject->career->code,
                        'semester' => $subject->semester,
                        'is_active' => $subject->is_active,
                    ])
                    ->values()
                    ->all(),
                'edit_url' => $canManage ? route('admin.professors.edit', $professor) : null,
                'delete_url' => $canDelete ? route('admin.professors.destroy', $professor) : null,
            ],
        ]);
    }

    /**
     * Muestra el formulario para crear una cuenta y su perfil docente.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/professors/form', [
            'professor' => null,
            ...$this->formOptions($request),
        ]);
    }

    /**
     * Crea la cuenta con contraseña temporal y sincroniza sus materias.
     */
    public function store(ProfessorRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $subjectIds = $data['subject_ids'];

        DB::transaction(function () use ($data, $subjectIds): void {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'must_change_password' => true,
            ]);

            $user->markEmailAsVerified();
            $user->assignRole(Role::Profesor->value);

            $professor = $user->professorProfile()->create([
                'employee_code' => $data['employee_code'],
                'department' => $data['department'],
                'academic_title' => $data['academic_title'],
            ]);

            $professor->subjects()->sync($subjectIds);
        });

        return redirect()
            ->route('admin.professors.index')
            ->with('success', "El profesor {$data['name']} fue registrado correctamente. Debe cambiar su contraseña temporal al ingresar.");
    }

    /**
     * Muestra los datos del perfil y las materias actualmente asignadas.
     */
    public function edit(Request $request, ProfessorProfile $professor): Response
    {
        $this->authorizeManage($request);
        $professor->load(['user', 'subjects']);

        return Inertia::render('admin/professors/form', [
            'professor' => [
                'id' => $professor->id,
                'name' => $professor->user->name,
                'email' => $professor->user->email,
                'employee_code' => $professor->employee_code,
                'department' => $professor->department,
                'academic_title' => $professor->academic_title,
                'subject_ids' => $professor->subjects->pluck('id')->map(
                    static fn (int|string $id): int => (int) $id,
                )->all(),
            ],
            ...$this->formOptions($request),
        ]);
    }

    /**
     * Actualiza la cuenta, el perfil docente y su conjunto de materias.
     */
    public function update(
        ProfessorRequest $request,
        ProfessorProfile $professor,
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($data, $professor): void {
            $professor->user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);
            $professor->update([
                'employee_code' => $data['employee_code'],
                'department' => $data['department'],
                'academic_title' => $data['academic_title'],
            ]);
            $professor->subjects()->sync($data['subject_ids']);
        });

        return redirect()
            ->route('admin.professors.index')
            ->with('success', "El perfil de {$data['name']} fue actualizado correctamente.");
    }

    /**
     * Elimina permanentemente la cuenta docente y sus datos relacionados.
     */
    public function destroy(Request $request, ProfessorProfile $professor): RedirectResponse
    {
        $this->authorizeDelete($request);
        $professor->load('user');

        abort_if(
            $professor->user->hasRole(Role::Admin->value)
                || $professor->user->is($request->user()),
            403,
            'No se puede eliminar la cuenta de un administrador.',
        );

        $name = $professor->user->name;

        DB::transaction(function () use ($professor): void {
            $professor->user->notifications()->delete();
            $professor->user->delete();
        });

        return redirect()
            ->route('admin.professors.index')
            ->with('success', "La cuenta y el perfil docente de {$name} fueron eliminados permanentemente.");
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::ProfessorsView->value),
            403,
            'No tienes permiso para acceder a los profesores.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::ProfessorsManage->value),
            403,
            'No tienes permiso para gestionar profesores.',
        );
    }

    /**
     * Verifica el permiso para eliminar cuentas docentes.
     */
    private function authorizeDelete(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::ProfessorsDelete->value),
            403,
            'No tienes permiso para eliminar profesores.',
        );
    }

    /**
     * Opciones compartidas por los formularios de alta y edición.
     *
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'subjects' => Subject::query()
                ->with('career:id,name,code')
                ->orderBy('career_id')
                ->orderBy('semester')
                ->orderBy('name')
                ->get(['id', 'career_id', 'semester', 'code', 'name', 'is_active'])
                ->map(static fn (Subject $subject): array => [
                    'id' => $subject->id,
                    'career_id' => $subject->career_id,
                    'career' => $subject->career->name,
                    'career_code' => $subject->career->code,
                    'semester' => $subject->semester,
                    'code' => $subject->code,
                    'name' => $subject->name,
                    'is_active' => $subject->is_active,
                ])
                ->all(),
            'can_manage_subjects' => $request->user()?->can(Permission::SubjectsManage->value) ?? false,
        ];
    }
}
