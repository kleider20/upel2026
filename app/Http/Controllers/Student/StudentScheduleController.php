<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\User;
use App\Support\StudentSchedule;
use App\Support\StudentSchedulePdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class StudentScheduleController extends Controller
{
    /**
     * Descarga o abre en el navegador el horario del estudiante en PDF.
     */
    public function download(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStudent(), 403);

        $profile = $user->studentProfile()->with('career')->first();

        $admission = Admission::query()
            ->where('converted_user_id', $user->id)
            ->latest()
            ->first();

        $schedule = StudentSchedule::forStudent(
            $profile?->career?->code,
            (int) ($profile?->current_semester ?? 1),
            $admission?->schedule,
        );

        abort_if($schedule === null, 404);

        $filename = sprintf(
            'horario-%s-%s.pdf',
            Str::slug((string) $schedule['career']),
            Str::slug((string) $schedule['period']),
        );

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response(StudentSchedulePdf::make($schedule), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
        ]);
    }
}
