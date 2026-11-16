<?php

namespace App\Support;

use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Carga académica del docente según los horarios publicados.
 *
 * El decano elige carrera, materia y docente al publicar un horario; esa es la
 * única fuente de las carreras y materias que ve el docente en su portal. Si
 * ninguna materia de los horarios lo tiene como titular, el docente queda
 * "pendiente por asignación".
 */
final class ProfessorAssignments
{
    /**
     * Horarios publicados en los que el docente aparece como titular.
     *
     * @return Collection<int, Schedule>
     */
    public static function schedules(User $professor): Collection
    {
        return Schedule::query()
            ->with([
                'career',
                'subjects' => static fn (BelongsToMany $subjects) => self::scopeToProfessor($subjects->getQuery(), $professor),
            ])
            ->whereHas(
                'subjects',
                static fn (Builder $subjects) => self::scopeToProfessor($subjects, $professor),
            )
            ->orderBy('career_id')
            ->orderBy('cohort')
            ->orderBy('id')
            ->get();
    }

    /**
     * Materias que el docente imparte en los horarios publicados.
     *
     * @return Collection<int, Subject>
     */
    public static function subjects(User $professor): Collection
    {
        $subjectIds = self::schedules($professor)
            ->flatMap(static fn (Schedule $schedule): array => $schedule->subjects->modelKeys())
            ->unique()
            ->values()
            ->all();

        if ($subjectIds === []) {
            return new Collection;
        }

        return Subject::query()
            ->with('career')
            ->whereKey($subjectIds)
            ->orderBy('career_id')
            ->orderBy('semester')
            ->orderBy('name')
            ->get();
    }

    /**
     * Indica si el horario asigna la materia al docente.
     */
    public static function teachesSubject(User $professor, int $subjectId): bool
    {
        return Schedule::query()
            ->whereHas('subjects', static function (Builder $subjects) use ($professor, $subjectId): void {
                self::scopeToProfessor($subjects, $professor);
                $subjects->whereKey($subjectId);
            })
            ->exists();
    }

    /**
     * Restringe la consulta de materias del horario al docente indicado.
     *
     * Los horarios nuevos guardan el usuario del docente; los horarios
     * anteriores solo conservan el nombre escrito en la plantilla.
     *
     * @param  Builder<Subject>  $query
     */
    private static function scopeToProfessor(Builder $query, User $professor): void
    {
        $teacherName = mb_strtolower(trim($professor->name));

        $query->where(static function (Builder $query) use ($professor, $teacherName): void {
            $query->where('schedule_subjects.professor_id', $professor->id)
                ->orWhere(static function (Builder $query) use ($teacherName): void {
                    $query->whereNull('schedule_subjects.professor_id')
                        ->whereRaw('LOWER(schedule_subjects.teacher_name) = ?', [$teacherName]);
                });
        });
    }
}
