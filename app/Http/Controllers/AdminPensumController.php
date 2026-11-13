<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Career;
use App\Models\Subject;
use App\Support\PensumPdf;
use App\Support\StudentSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AdminPensumController extends Controller
{
    /**
     * Genera el PDF del pensum.
     */
    public function pdf(Request $request, Career $career): SymfonyResponse
    {
        $this->authorizeView($request);

        $career->load(['subjects' => static fn ($query) => $query->orderBy('semester')->orderBy('name')]);

        $pdfContent = PensumPdf::make([
            'name' => $career->name,
            'degree' => $career->degree,
            'code' => $career->code,
        ], $this->pensum($career->subjects));

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';
        $filename = 'pensum-'.Str::slug($career->code).'.pdf';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
        ]);
    }

    /**
     * Listado de carreras con el resumen de su pensum.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $careers = Career::query()
            ->with(['subjects:id,career_id,semester,credits'])
            ->orderBy('name')
            ->get()
            ->map(static function (Career $career): array {
                $semesters = $career->subjects
                    ->pluck('semester')
                    ->unique()
                    ->sort()
                    ->values();

                return [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'icon' => $career->icon ?? '🎓',
                    'subjects_count' => $career->subjects->count(),
                    'semesters_count' => $semesters->count(),
                    'credits_total' => $career->subjects->sum('credits'),
                    'show_url' => route('admin.pensums.show', ['career' => $career->code]),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/pensums/index', [
            'careers' => $careers,
            'stats' => [
                [
                    'label' => 'Carreras',
                    'value' => (string) Career::query()->count(),
                    'tone' => 'blue',
                ],
                [
                    'label' => 'Con pensum',
                    'value' => (string) Subject::query()->distinct()->count('career_id'),
                    'tone' => 'green',
                ],
                [
                    'label' => 'Materias',
                    'value' => (string) Subject::query()->count(),
                    'tone' => 'navy',
                ],
                [
                    'label' => 'Créditos',
                    'value' => (string) Subject::query()->sum('credits'),
                    'tone' => 'gold',
                ],
            ],
            'can_manage' => $request->user()?->can(Permission::SubjectsManage->value) ?? false,
        ]);
    }

    /**
     * Pensum de una carrera agrupado por período académico.
     */
    public function show(Request $request, Career $career): Response
    {
        $this->authorizeView($request);

        $career->load([
            'subjects' => static fn ($query) => $query
                ->orderBy('semester')
                ->orderBy('name'),
        ]);

        return Inertia::render('admin/pensums/show', [
            'career' => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'icon' => $career->icon ?? '🎓',
                'degree' => $career->degree,
                'duration_semesters' => $career->duration_semesters,
                'subjects_count' => $career->subjects->count(),
                'credits_total' => $career->subjects->sum('credits'),
            ],
            'pensum' => $this->pensum($career->subjects),
            'can_manage' => $request->user()?->can(Permission::SubjectsManage->value) ?? false,
        ]);
    }

    /**
     * Agrupa las materias por período académico.
     *
     * @param  Collection<int, Subject>  $subjects
     * @return array<int, array<string, mixed>>
     */
    private function pensum(Collection $subjects): array
    {
        return $subjects
            ->groupBy('semester')
            ->sortKeys()
            ->map(static fn (Collection $group, int $semester): array => [
                'semester' => $semester,
                'label' => StudentSchedule::roman($semester),
                'credits' => $group->sum('credits'),
                'subjects' => $group
                    ->map(static fn (Subject $subject): array => [
                        'id' => $subject->id,
                        'code' => $subject->code,
                        'name' => $subject->name,
                        'credits' => $subject->credits,
                        'theory_hours' => $subject->theory_hours,
                        'practice_hours' => $subject->practice_hours,
                        'component' => $subject->component,
                        'type' => $subject->type,
                        'area' => $subject->area,
                        'level' => $subject->level,
                        'modality' => $subject->modality,
                        'modality_label' => $subject->modalityLabel(),
                        'prerequisites' => $subject->prerequisites,
                        'is_active' => $subject->is_active,
                        'edit_url' => route('admin.subjects.edit', $subject),
                        'delete_url' => route('admin.subjects.destroy', $subject),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * Verifica el permiso de lectura de materias.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::SubjectsView->value),
            403,
            'No tienes permiso para acceder a los pensums.',
        );
    }
}
