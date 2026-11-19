<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentEnrollmentRequest;
use App\Models\User;
use App\Support\AdmissionWindow;
use App\Support\StudentEnrollment;
use App\Support\StudentEnrollmentSheetPdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StudentEnrollmentController extends Controller
{
    /**
     * Página de inscripción de materias del siguiente período.
     */
    public function index(Request $request): InertiaResponse|RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isStudent()) {
            return redirect()->route('login');
        }

        return Inertia::render('student/inscripciones/index', [
            'enrollment' => StudentEnrollment::for($user)->payload(),
        ]);
    }

    /**
     * Guarda la selección de materias mientras la ventana está habilitada.
     */
    public function store(StudentEnrollmentRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStudent(), 403);
        abort_unless(
            (new AdmissionWindow)->isEnrollmentOpen(),
            403,
            'La ventana de inscripciones está cerrada.',
        );

        StudentEnrollment::for($user)->save($request->subjectIds());

        return back()->with('success', 'Inscripción registrada correctamente.');
    }

    /**
     * Abre la planilla de inscripción con las materias del período.
     */
    public function sheet(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStudent(), 403);

        $sheet = StudentEnrollment::for($user)->sheet();

        abort_if($sheet['rows'] === [], 404);

        $filename = sprintf(
            'planilla-inscripcion-%s-%s.pdf',
            Str::slug($user->name),
            Str::slug((string) $sheet['period']),
        );

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response(StudentEnrollmentSheetPdf::make($sheet), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
        ]);
    }
}
