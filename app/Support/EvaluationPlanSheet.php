<?php

namespace App\Support;

use App\Models\Enrollment;
use App\Models\EvaluationPlan;
use App\Models\EvaluationPlanScore;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Planilla oficial de evaluación de una unidad curricular.
 *
 * Reúne los datos de la cabecera del formato UPEL y las filas de estudiantes
 * con sus notas por evaluación y la nota definitiva calculada en vivo.
 */
final class EvaluationPlanSheet
{
    /**
     * Sede del núcleo donde se aplica el plan.
     */
    public const SEDE = 'IMPM Vargas - La Guaira';

    /**
     * Datos de identificación del plan en el orden de la planilla.
     *
     * @return array{
     *     profesor: string,
     *     cedula: string|null,
     *     programa: string,
     *     sede: string,
     *     especialidad: string,
     *     especialidad_codigo: string|null,
     *     curso: string,
     *     periodo: string,
     *     periodo_activo: bool,
     *     horario: string,
     *     ambiente: string,
     *     carrera: string,
     *     cohorte: string,
     *     fecha_inicio: string|null,
     *     fecha_fin: string|null
     * }
     */
    public static function header(EvaluationPlan $plan): array
    {
        $plan->loadMissing([
            'professor.professorProfile',
            'schedule',
            'subject.career',
            'academicPeriod',
        ]);

        $career = $plan->subject->career;
        $schedule = $plan->schedule;

        return [
            'profesor' => $plan->professor->name,
            'cedula' => $plan->professor->professorProfile?->identity_document,
            'programa' => $career?->programTypeLabel() ?? 'Pregrado',
            'sede' => self::SEDE,
            'especialidad' => $career?->name ?? 'Sin carrera',
            'especialidad_codigo' => $career?->code,
            'curso' => $plan->courseLabel(),
            'periodo' => $plan->academicPeriod->name,
            'periodo_activo' => (bool) $plan->academicPeriod->is_active,
            'horario' => AcademicOptions::scheduleLabel($schedule?->study_schedule),
            'ambiente' => AcademicOptions::modalityLabel($plan->subject->modality),
            'carrera' => $career?->name ?? 'Sin carrera',
            'cohorte' => $schedule?->cohort ?? 'Sin cohorte',
            'fecha_inicio' => $plan->starts_on?->format('d/m/Y'),
            'fecha_fin' => $plan->ends_on?->format('d/m/Y'),
        ];
    }

    /**
     * Filas del cohorte del plan con sus notas por evaluación.
     *
     * El roster reúne a los estudiantes activos de la carrera del plan y a los
     * ya inscritos en la materia, aunque todavía no tengan inscripción. Cada
     * fila indica el cohorte del plan (actual) y el cohorte propio del
     * estudiante cuando es distinto, para identificar a los rezagados.
     *
     * @return array<int, array{
     *     student_id: int,
     *     enrollment_id: int|null,
     *     enrolled: bool,
     *     student_name: string,
     *     student_code: string|null,
     *     id_number: string|null,
     *     semester: int|null,
     *     cohort: string|null,
     *     current_cohort: string|null,
     *     career_code: string|null,
     *     scores: array<int, float|null>,
     *     definitive: float|null,
     *     definitive_ten: float|null,
     *     approved: bool|null
     * }>
     */
    public static function studentRows(EvaluationPlan $plan): array
    {
        $plan->loadMissing(['subject.career', 'schedule', 'items']);

        $items = $plan->items->values();
        $career = $plan->subject->career;
        $currentCohort = $plan->schedule?->cohort;

        $enrollments = Enrollment::query()
            ->with(['student.studentProfile', 'student.admission'])
            ->where('subject_id', $plan->subject_id)
            ->where('academic_period_id', $plan->academic_period_id)
            ->get()
            ->keyBy('student_id');

        $students = User::query()
            ->where(function (Builder $query) use ($career, $enrollments): void {
                $query->whereHas('studentProfile', static function (Builder $profile) use ($career): void {
                    $profile->where('career_id', $career?->id)->where('status', 'activo');
                })->orWhereIn('id', $enrollments->keys()->all());
            })
            ->with(['studentProfile', 'admission'])
            ->orderBy('name')
            ->get();

        $cohorts = DB::table('enrollments')
            ->join('schedule_subjects', 'schedule_subjects.subject_id', '=', 'enrollments.subject_id')
            ->join('schedules', 'schedules.id', '=', 'schedule_subjects.schedule_id')
            ->whereIn('enrollments.student_id', $students->modelKeys())
            ->distinct()
            ->get(['enrollments.student_id', 'schedules.cohort'])
            ->groupBy('student_id');

        $scores = EvaluationPlanScore::query()
            ->whereIn('evaluation_plan_item_id', $items->pluck('id'))
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()
            ->groupBy('enrollment_id');

        return $students
            ->map(static function (User $student) use ($career, $cohorts, $currentCohort, $enrollments, $items, $scores): array {
                /** @var Enrollment|null $enrollment */
                $enrollment = $enrollments->get($student->id);
                $profile = $student->studentProfile;
                $itemScores = $enrollment === null
                    ? collect()
                    : $scores->get($enrollment->id, collect())->keyBy('evaluation_plan_item_id');

                $scoresByItem = [];
                $entries = [];

                foreach ($items as $item) {
                    $score = $itemScores->get($item->id)?->score;

                    $scoresByItem[$item->id] = $score;
                    $entries[] = ['score' => $score, 'weight' => $item->weight];
                }

                $definitive = $enrollment === null
                    ? null
                    : EvaluationPlanGrading::weightedScore($entries);
                $definitiveTen = EvaluationPlanGrading::toScaleTen($definitive);

                return [
                    'student_id' => $student->id,
                    'enrollment_id' => $enrollment?->id,
                    'enrolled' => $enrollment !== null,
                    'student_name' => $student->name,
                    'student_code' => $profile?->student_code,
                    'id_number' => $student->admission?->id_number,
                    'semester' => $profile?->current_semester,
                    'cohort' => self::studentCohort($cohorts->get($student->id, collect())->pluck('cohort'), $currentCohort, $profile?->admission_year),
                    'current_cohort' => $currentCohort,
                    'career_code' => $career?->code,
                    'scores' => $scoresByItem,
                    'definitive' => $definitive,
                    'definitive_ten' => $definitiveTen,
                    'approved' => EvaluationPlanGrading::isApproved($definitiveTen),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Cohorte propio del estudiante: el horario donde cursa sus materias; si
     * no tiene horario, el año de ingreso de su perfil.
     *
     * @param  Collection<int, string>  $cohorts
     */
    private static function studentCohort(Collection $cohorts, ?string $currentCohort, ?int $admissionYear): ?string
    {
        $cohorts = $cohorts->filter()->unique()->values();

        if ($currentCohort !== null && $cohorts->contains($currentCohort)) {
            return $currentCohort;
        }

        return $cohorts->first() ?? ($admissionYear !== null ? (string) $admissionYear : null);
    }
}
