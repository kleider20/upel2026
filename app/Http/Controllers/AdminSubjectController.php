<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\SubjectRequest;
use App\Models\Career;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Support\AcademicOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubjectController extends Controller
{
    /**
     * Listado administrativo de materias con filtros y resumen.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $search = trim($request->string('search')->toString());
        $careerId = $request->integer('career_id') ?: null;
        $semester = $request->integer('semester') ?: null;
        $modality = $request->string('modality')->toString();

        $subjects = Subject::query()
            ->with('career:id,name,code')
            ->withCount(['professors', 'enrollments'])
            ->when(
                $search !== '',
                static fn ($query) => $query->where(
                    static fn ($query) => $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%"),
                ),
            )
            ->when($careerId, static fn ($query) => $query->where('career_id', $careerId))
            ->when($semester, static fn ($query) => $query->where('semester', $semester))
            ->when($modality !== '', static fn ($query) => $query->where('modality', $modality))
            ->orderBy('career_id')
            ->orderBy('semester')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Subject $subject): array => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'career' => $subject->career?->name ?? '—',
                'career_code' => $subject->career?->code,
                'semester' => $subject->semester,
                'modality' => $subject->modality,
                'modality_label' => $subject->modalityLabel(),
                'credits' => $subject->credits,
                'theory_hours' => $subject->theory_hours,
                'practice_hours' => $subject->practice_hours,
                'component' => $subject->component,
                'type' => $subject->type,
                'prerequisites' => $subject->prerequisites,
                'is_active' => $subject->is_active,
                'professors_count' => $subject->professors_count,
                'enrollments_count' => $subject->enrollments_count,
                'edit_url' => route('admin.subjects.edit', $subject),
                'delete_url' => route('admin.subjects.destroy', $subject),
            ]);

        return Inertia::render('admin/subjects/index', [
            'subjects' => $subjects,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'career_id' => $careerId,
                'semester' => $semester,
                'modality' => $modality !== '' ? $modality : null,
            ],
            'careers' => $this->careers(),
            'modalities' => AcademicOptions::modalityOptions(),
            'semesters' => Subject::query()
                ->distinct()
                ->orderBy('semester')
                ->pluck('semester'),
            'stats' => [
                ['label' => 'Materias', 'value' => (string) Subject::query()->count(), 'tone' => 'blue'],
                ['label' => 'Activas', 'value' => (string) Subject::query()->where('is_active', true)->count(), 'tone' => 'green'],
                ['label' => 'Carreras con pensum', 'value' => (string) Subject::query()->distinct()->count('career_id'), 'tone' => 'navy'],
                ['label' => 'Inscripciones', 'value' => (string) Enrollment::query()->count(), 'tone' => 'gold'],
            ],
            'can_manage' => $request->user()?->can(Permission::SubjectsManage->value) ?? false,
        ]);
    }

    /**
     * Formulario de creación de una materia.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/subjects/form', [
            'subject' => null,
            ...$this->formOptions(),
        ]);
    }

    /**
     * Registra una nueva materia.
     */
    public function store(SubjectRequest $request): RedirectResponse
    {
        $subject = Subject::create($request->validated());

        return redirect()
            ->route('admin.subjects.index')
            ->with('success', "La materia {$subject->name} fue registrada correctamente.");
    }

    /**
     * Formulario de edición de una materia.
     */
    public function edit(Request $request, Subject $subject): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/subjects/form', [
            'subject' => [
                'id' => $subject->id,
                'career_id' => $subject->career_id,
                'code' => $subject->code,
                'name' => $subject->name,
                'semester' => $subject->semester,
                'modality' => $subject->modality,
                'component' => $subject->component,
                'type' => $subject->type,
                'area' => $subject->area,
                'level' => $subject->level,
                'credits' => $subject->credits,
                'theory_hours' => $subject->theory_hours,
                'practice_hours' => $subject->practice_hours,
                'prerequisites' => $subject->prerequisites,
                'is_active' => $subject->is_active,
            ],
            ...$this->formOptions(),
        ]);
    }

    /**
     * Actualiza los datos de una materia.
     */
    public function update(SubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update($request->validated());

        return redirect()
            ->route('admin.subjects.index')
            ->with('success', "La materia {$subject->name} fue actualizada correctamente.");
    }

    /**
     * Elimina una materia sin inscripciones asociadas.
     */
    public function destroy(Request $request, Subject $subject): RedirectResponse
    {
        $this->authorizeManage($request);

        if ($subject->enrollments()->exists()) {
            return back()->with(
                'error',
                "No se puede eliminar {$subject->name}: tiene inscripciones registradas.",
            );
        }

        $subject->professors()->detach();
        $subject->delete();

        return redirect()
            ->route('admin.subjects.index')
            ->with('success', "La materia {$subject->name} fue eliminada correctamente.");
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SubjectsView->value),
            403,
            'No tienes permiso para acceder a las materias.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SubjectsManage->value),
            403,
            'No tienes permiso para gestionar las materias.',
        );
    }

    /**
     * Opciones compartidas por los formularios de alta y edición.
     *
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'careers' => $this->careers(),
            'subjects' => Subject::query()
                ->orderBy('semester')
                ->orderBy('name')
                ->get(['id', 'career_id', 'code', 'name', 'semester'])
                ->map(static fn (Subject $subject): array => [
                    'id' => $subject->id,
                    'career_id' => $subject->career_id,
                    'code' => $subject->code,
                    'name' => $subject->name,
                    'semester' => $subject->semester,
                ])
                ->all(),
            'modalities' => AcademicOptions::modalityOptions(),
            'components' => [
                ['value' => 'CFPE', 'label' => 'Formación profesional específica'],
                ['value' => 'CFD', 'label' => 'Formación docente'],
                ['value' => 'CFC', 'label' => 'Formación contextualizada'],
                ['value' => 'ECU', 'label' => 'Investigación y práctica'],
            ],
            'types' => [
                ['value' => 'UNCO', 'label' => 'Unidad curricular obligatoria'],
                ['value' => 'UNCLE', 'label' => 'Unidad curricular de libre elección'],
            ],
            'levels' => [
                ['value' => 'FUND', 'label' => 'Fundamental'],
                ['value' => 'INTEG', 'label' => 'Integración'],
                ['value' => 'PROF', 'label' => 'Profesional'],
            ],
        ];
    }

    /**
     * Carreras disponibles para asignar materias.
     *
     * @return array<int, array{id: int, name: string, code: string}>
     */
    private function careers(): array
    {
        return Career::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(static fn (Career $career): array => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
            ])
            ->all();
    }
}
