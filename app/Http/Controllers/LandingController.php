<?php

namespace App\Http\Controllers;

use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\Subject;
use App\Support\AdmissionWindow;
use App\Support\StudentSchedule;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function __construct(private AdmissionWindow $window) {}

    /**
     * Show the public UPEL landing page.
     *
     * Las fechas se calculan en la zona horaria de Venezuela (GMT-4) y se
     * envían al frontend como cadenas ISO-8601 para que los contadores y los
     * estados de los botones se mantengan sincronizados con el servidor.
     */
    public function index(): Response
    {
        return Inertia::render('landing/index', [
            'canRegister' => $this->window->isOpen(),
            'canEnroll' => $this->window->isEnrollmentOpen(),
            'preEnrollmentOpensAt' => $this->window->opensAt()->toIso8601String(),
            'enrollmentOpensAt' => $this->window->enrollmentOpensAt()->toIso8601String(),
            'graduationDate' => $this->window->graduationAt()->toIso8601String(),
            'careers' => $this->offeredCareers(),
        ]);
    }

    /**
     * Página pública con la información ampliada y el pensum de una carrera.
     */
    public function career(Career $career): Response
    {
        abort_unless($career->is_active, 404);

        $career->load([
            'offerings' => static fn ($query) => $query
                ->where('is_active', true)
                ->orderBy('schedule')
                ->orderBy('shift'),
            'subjects' => static fn ($query) => $query
                ->where('is_active', true)
                ->orderBy('semester')
                ->orderBy('name'),
        ]);

        return Inertia::render('landing/career', [
            'canRegister' => $this->window->isOpen(),
            'preEnrollmentOpensAt' => $this->window->opensAt()->toIso8601String(),
            'career' => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'description' => $career->description,
                'degree' => $career->degree,
                'icon' => $career->icon ?? '🎓',
                'image_url' => $career->imageUrl(),
                'modality' => $this->modalityFor(
                    $career->offerings,
                    $career->modality,
                ),
                'duration' => $this->durationLabel($career->duration_semesters),
                'duration_semesters' => $career->duration_semesters,
                'subjects_count' => $career->subjects->count(),
                'credits_total' => $career->subjects->sum('credits'),
                'offerings' => $career->offerings
                    ->map(static fn (CareerOffering $offering): array => [
                        'id' => $offering->id,
                        'modality' => $offering->modality,
                        'modality_label' => $offering->modalityLabel(),
                        'schedule' => $offering->schedule,
                        'schedule_label' => $offering->scheduleLabel(),
                        'shift' => $offering->shift,
                        'shift_label' => $offering->shiftLabel(),
                    ])
                    ->values()
                    ->all(),
            ],
            'pensum' => $this->pensum($career->subjects),
        ]);
    }

    /**
     * Carreras activas con al menos una oferta activa.
     *
     * @return array<int, array<string, mixed>>
     */
    private function offeredCareers(): array
    {
        return Career::query()
            ->where('is_active', true)
            ->whereHas('offerings', static fn ($query) => $query->where('is_active', true))
            ->with(['offerings' => static fn ($query) => $query
                ->where('is_active', true)
                ->orderBy('schedule')
                ->orderBy('shift')])
            ->orderBy('name')
            ->get()
            ->map(fn (Career $career): array => [
                'id' => $career->id,
                'name' => $career->name,
                'code' => $career->code,
                'description' => $career->description,
                'degree' => $career->degree,
                'icon' => $career->icon ?? '🎓',
                'image_url' => $career->imageUrl(),
                'modality' => $this->modalityFor(
                    $career->offerings,
                    $career->modality,
                ),
                'duration' => $this->durationLabel($career->duration_semesters),
                'show_url' => route('careers.show', ['career' => $career->code]),
            ])
            ->values()
            ->all();
    }

    /**
     * Agrupa las materias activas por período académico.
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
                        'modality' => $subject->modality,
                        'modality_label' => $subject->modalityLabel(),
                        'prerequisites' => $subject->prerequisites,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * Modalidad mostrada según las ofertas activas de la carrera.
     *
     * @param  Collection<int, CareerOffering>  $offerings
     */
    private function modalityFor(Collection $offerings, string $fallback): string
    {
        $modalities = $offerings
            ->pluck('modality')
            ->filter()
            ->unique()
            ->values();

        return match ($modalities->count()) {
            0 => $fallback,
            1 => (string) $modalities->first(),
            default => 'mixta',
        };
    }

    /**
     * Duración legible en años a partir de los períodos de la carrera.
     */
    private function durationLabel(int $semesters): string
    {
        $years = max(1, (int) ceil($semesters / 2));

        return $years.' '.($years === 1 ? 'año' : 'años');
    }
}
