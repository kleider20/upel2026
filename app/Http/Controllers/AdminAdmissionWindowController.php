<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Http\Requests\UpdateAdmissionWindowRequest;
use App\Http\Requests\UpdateEnrollmentWindowRequest;
use App\Models\AdmissionWindowSetting;
use App\Models\EnrollmentWindowSetting;
use App\Support\AdmissionWindow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAdmissionWindowController extends Controller
{
    /**
     * Panel de la ventana de inscripción formal.
     */
    public function inscripciones(Request $request, AdmissionWindow $window): Response
    {
        return $this->renderPanel(
            $request,
            'inscripcion',
            $window->enrollmentAdminSummary(),
            route('admin.inscripciones.update', absolute: false),
        );
    }

    /**
     * Panel de la ventana de preinscripción.
     */
    public function preinscripciones(Request $request, AdmissionWindow $window): Response
    {
        return $this->renderPanel(
            $request,
            'preinscripcion',
            $window->adminSummary(),
            route('admin.preinscripciones.update', absolute: false),
        );
    }

    /**
     * Actualiza las fechas y el estado manual de la inscripción formal.
     */
    public function update(UpdateEnrollmentWindowRequest $request): RedirectResponse
    {
        EnrollmentWindowSetting::current()->update($request->validated());

        return back()->with('success', 'La ventana de inscripciones se actualizó correctamente.');
    }

    /**
     * Actualiza las fechas y el estado manual de la preinscripción.
     */
    public function updatePreinscripciones(UpdateAdmissionWindowRequest $request): RedirectResponse
    {
        AdmissionWindowSetting::current()->update($request->validated());

        return back()->with('success', 'La ventana de preinscripciones se actualizó correctamente.');
    }

    /**
     * @param  array{opens_on: string, closes_on: string, mode: string, is_open: bool, status_label: string, status_tone: string, detail: string}  $summary
     */
    private function renderPanel(
        Request $request,
        string $variant,
        array $summary,
        string $updateUrl,
    ): Response {
        abort_unless(
            $request->user()?->can(Permission::AdmissionsWindow->value),
            403,
            'No tienes permiso para habilitar las inscripciones.',
        );

        return Inertia::render('admin/inscripciones/index', [
            'variant' => $variant,
            'admission_window' => [
                ...$summary,
                'can_manage' => true,
            ],
            'update_url' => $updateUrl,
        ]);
    }
}
