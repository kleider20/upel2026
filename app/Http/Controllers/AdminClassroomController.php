<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\ClassroomRequest;
use App\Models\Classroom;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminClassroomController extends Controller
{
    /**
     * Catálogo de aulas disponibles para los horarios.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $search = trim($request->string('search')->toString());

        $classrooms = Classroom::query()
            ->when($search !== '', static fn ($query) => $query
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%"))
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Classroom $classroom): array => [
                'id' => $classroom->id,
                'code' => $classroom->code,
                'name' => $classroom->name,
                'capacity' => $classroom->capacity,
                'is_active' => $classroom->is_active,
                'edit_url' => route('admin.classrooms.edit', $classroom),
                'delete_url' => route('admin.classrooms.destroy', $classroom),
            ]);

        return Inertia::render('admin/classrooms/index', [
            'classrooms' => $classrooms,
            'filters' => ['search' => $search !== '' ? $search : null],
            'can_manage' => $request->user()?->can(Permission::SchedulesManage->value) ?? false,
        ]);
    }

    /**
     * Formulario de alta de aula.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/classrooms/form', [
            'classroom' => null,
        ]);
    }

    /**
     * Guarda un aula nueva.
     */
    public function store(ClassroomRequest $request): RedirectResponse
    {
        Classroom::query()->create($request->validated());

        return redirect()
            ->route('admin.classrooms.index')
            ->with('success', 'El aula fue registrada correctamente.');
    }

    /**
     * Formulario de edición de un aula.
     */
    public function edit(Request $request, Classroom $classroom): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/classrooms/form', [
            'classroom' => [
                'id' => $classroom->id,
                'code' => $classroom->code,
                'name' => $classroom->name,
                'capacity' => $classroom->capacity,
                'is_active' => $classroom->is_active,
            ],
        ]);
    }

    /**
     * Actualiza un aula.
     */
    public function update(ClassroomRequest $request, Classroom $classroom): RedirectResponse
    {
        $classroom->update($request->validated());

        return redirect()
            ->route('admin.classrooms.index')
            ->with('success', 'El aula fue actualizada correctamente.');
    }

    /**
     * Elimina un aula que no esté asignada a ningún horario.
     */
    public function destroy(Request $request, Classroom $classroom): RedirectResponse
    {
        $this->authorizeManage($request);

        abort_if(
            $classroom->schedules()->exists(),
            422,
            'No se puede eliminar un aula asignada a un horario.',
        );

        $classroom->delete();

        return redirect()
            ->route('admin.classrooms.index')
            ->with('success', 'El aula fue eliminada correctamente.');
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SchedulesView->value),
            403,
            'No tienes permiso para consultar las aulas.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SchedulesManage->value),
            403,
            'No tienes permiso para gestionar las aulas.',
        );
    }
}
