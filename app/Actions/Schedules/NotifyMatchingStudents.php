<?php

namespace App\Actions\Schedules;

use App\Enums\AdmissionStatus;
use App\Enums\Role;
use App\Models\Schedule;
use App\Models\User;
use App\Notifications\SchedulePublishedNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class NotifyMatchingStudents
{
    /**
     * Notify active students whose academic profile matches the published schedule.
     */
    public function handle(Schedule $schedule): void
    {
        if ($schedule->modality === null || $schedule->study_schedule === null) {
            return;
        }

        User::query()
            ->whereHas('roles', static fn (Builder $query) => $query->where('name', Role::Estudiante->value))
            ->whereHas('studentProfile', static fn (Builder $query) => $query
                ->where('career_id', $schedule->career_id)
                ->where('current_semester', $schedule->period)
                ->where('status', 'activo'))
            ->whereHas('admission', static fn (Builder $query) => $query
                ->where('career_id', $schedule->career_id)
                ->where('modality', $schedule->modality)
                ->where('schedule', $schedule->study_schedule)
                ->where('status', AdmissionStatus::Convertida->value))
            ->chunkById(100, static function (Collection $students) use ($schedule): void {
                foreach ($students as $student) {
                    $student->notify(new SchedulePublishedNotification($schedule));
                }
            });
    }
}
