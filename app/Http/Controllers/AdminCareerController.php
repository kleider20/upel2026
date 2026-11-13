<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\CareerRequest;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\Subject;
use App\Support\AcademicOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminCareerController extends Controller
{
    /**
     * Listado administrativo de carreras con sus ofertas académicas.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $search = trim($request->string('search')->toString());
        $modality = $request->string('modality')->toString();
        $schedule = $request->string('schedule')->toString();

        $careers = Career::query()
            ->with(['offerings' => static fn ($query) => $query
                ->orderBy('schedule')
                ->orderBy('shift')])
            ->withCount(['subjects', 'studentProfiles'])
            ->when(
                $search !== '',
                static fn ($query) => $query->where(
                    static fn ($query) => $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%"),
                ),
            )
            ->when(
                $modality !== '',
                static fn ($query) => $query->whereHas(
                    'offerings',
                    static fn ($query) => $query->where('modality', $modality),
                ),
            )
            ->when(
                $schedule !== '',
                static fn ($query) => $query->whereHas(
                    'offerings',
                    static fn ($query) => $query->where('schedule', $schedule),
                ),
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Career $career): array => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'description' => $career->description,
                'degree' => $career->degree,
                'icon' => $career->icon,
                'image_url' => $career->imageUrl(),
                'duration_semesters' => $career->duration_semesters,
                'is_active' => $career->is_active,
                'subjects_count' => $career->subjects_count,
                'students_count' => $career->student_profiles_count,
                'offerings' => $career->offerings
                    ->map(static fn (CareerOffering $offering): array => [
                        'id' => $offering->id,
                        'modality' => $offering->modality,
                        'modality_label' => $offering->modalityLabel(),
                        'schedule' => $offering->schedule,
                        'schedule_label' => $offering->scheduleLabel(),
                        'shift' => $offering->shift,
                        'shift_label' => $offering->shiftLabel(),
                        'is_active' => $offering->is_active,
                    ])
                    ->values()
                    ->all(),
                'edit_url' => route('admin.careers.edit', $career),
                'delete_url' => route('admin.careers.destroy', $career),
            ]);

        return Inertia::render('admin/careers/index', [
            'careers' => $careers,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'modality' => $modality !== '' ? $modality : null,
                'schedule' => $schedule !== '' ? $schedule : null,
            ],
            'modalities' => AcademicOptions::modalityOptions(),
            'schedules' => AcademicOptions::scheduleOptions(),
            'stats' => [
                ['label' => 'Carreras', 'value' => (string) Career::query()->count(), 'tone' => 'blue'],
                ['label' => 'Activas', 'value' => (string) Career::query()->where('is_active', true)->count(), 'tone' => 'green'],
                ['label' => 'Ofertas', 'value' => (string) CareerOffering::query()->count(), 'tone' => 'gold'],
                ['label' => 'Materias', 'value' => (string) Subject::query()->count(), 'tone' => 'navy'],
            ],
            'can_manage' => $request->user()?->can(Permission::CareersManage->value) ?? false,
        ]);
    }

    /**
     * Formulario de creación de una carrera.
     */
    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('admin/careers/form', [
            'career' => null,
            ...$this->formOptions(),
        ]);
    }

    /**
     * Registra una nueva carrera con sus ofertas académicas.
     */
    public function store(CareerRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $offerings = $data['offerings'];
        $image = $request->file('image');
        unset($data['offerings'], $data['image'], $data['remove_image']);

        if ($image !== null) {
            $data['image_path'] = $image->store('careers', 'public');
        }

        $career = DB::transaction(function () use ($data, $offerings): Career {
            $career = Career::create([
                ...$data,
                'modality' => $this->aggregateModality($offerings),
            ]);

            $career->offerings()->createMany($offerings);

            return $career;
        });

        return redirect()
            ->route('admin.careers.index')
            ->with('success', "La carrera {$career->name} fue registrada correctamente.");
    }

    /**
     * Formulario de edición de una carrera.
     */
    public function edit(Request $request, Career $career): Response
    {
        $this->authorizeManage($request);

        $career->load(['offerings' => static fn ($query) => $query
            ->orderBy('schedule')
            ->orderBy('shift')]);

        return Inertia::render('admin/careers/form', [
            'career' => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'description' => $career->description,
                'degree' => $career->degree,
                'icon' => $career->icon,
                'image_url' => $career->imageUrl(),
                'duration_semesters' => $career->duration_semesters,
                'is_active' => $career->is_active,
                'offerings' => $career->offerings
                    ->map(static fn (CareerOffering $offering): array => [
                        'modality' => $offering->modality,
                        'schedule' => $offering->schedule,
                        'shift' => $offering->shift,
                        'is_active' => $offering->is_active,
                    ])
                    ->values()
                    ->all(),
            ],
            ...$this->formOptions(),
        ]);
    }

    /**
     * Actualiza los datos de una carrera y reemplaza sus ofertas.
     */
    public function update(CareerRequest $request, Career $career): RedirectResponse
    {
        $data = $request->validated();
        $offerings = $data['offerings'];
        $image = $request->file('image');
        $removeImage = $request->boolean('remove_image');
        unset($data['offerings'], $data['image'], $data['remove_image']);

        DB::transaction(function () use ($career, $data, $offerings, $image, $removeImage): void {
            if ($image !== null) {
                $this->deleteImage($career->image_path);
                $data['image_path'] = $image->store('careers', 'public');
            } elseif ($removeImage) {
                $this->deleteImage($career->image_path);
                $data['image_path'] = null;
            }

            $career->update([
                ...$data,
                'modality' => $this->aggregateModality($offerings),
            ]);

            $career->offerings()->delete();
            $career->offerings()->createMany($offerings);
        });

        return redirect()
            ->route('admin.careers.index')
            ->with('success', "La carrera {$career->name} fue actualizada correctamente.");
    }

    /**
     * Elimina una carrera sin materias ni estudiantes asociados.
     */
    public function destroy(Request $request, Career $career): RedirectResponse
    {
        $this->authorizeManage($request);

        if ($career->subjects()->exists()) {
            return back()->with(
                'error',
                "No se puede eliminar {$career->name}: tiene materias registradas.",
            );
        }

        if ($career->studentProfiles()->exists()) {
            return back()->with(
                'error',
                "No se puede eliminar {$career->name}: tiene estudiantes registrados.",
            );
        }

        $career->offerings()->delete();
        $this->deleteImage($career->image_path);
        $career->delete();

        return redirect()
            ->route('admin.careers.index')
            ->with('success', "La carrera {$career->name} fue eliminada correctamente.");
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::CareersView->value),
            403,
            'No tienes permiso para acceder a las carreras.',
        );
    }

    /**
     * Verifica el permiso de gestión del módulo.
     */
    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::CareersManage->value),
            403,
            'No tienes permiso para gestionar las carreras.',
        );
    }

    /**
     * Elimina del disco público la imagen anterior de una carrera.
     */
    private function deleteImage(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Opciones compartidas por los formularios de alta y edición.
     *
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'modalities' => AcademicOptions::modalityOptions(),
            'schedules' => AcademicOptions::scheduleOptions(),
            'shifts' => AcademicOptions::shiftOptions(),
        ];
    }

    /**
     * Resume la modalidad principal de la carrera a partir de sus ofertas.
     *
     * @param  array<int, array{modality: string}>  $offerings
     */
    private function aggregateModality(array $offerings): string
    {
        $modalities = collect($offerings)
            ->pluck('modality')
            ->filter()
            ->unique()
            ->values();

        return match ($modalities->count()) {
            0 => 'presencial',
            1 => (string) $modalities->first(),
            default => 'mixta',
        };
    }
}
