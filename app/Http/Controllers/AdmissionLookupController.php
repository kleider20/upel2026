<?php

namespace App\Http\Controllers;

use App\Http\Requests\LookupAdmissionRequest;
use App\Models\Admission;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionLookupController extends Controller
{
    /**
     * Formulario público para consultar el estado de una solicitud.
     */
    public function index(): Response
    {
        return Inertia::render('admissions/status', [
            'admission' => null,
        ]);
    }

    /**
     * Busca la solicitud más reciente por correo y cédula y redirige al enlace firmado.
     */
    public function lookup(LookupAdmissionRequest $request): RedirectResponse
    {
        $admission = Admission::query()
            ->where('email', $request->string('email')->toString())
            ->where('id_number', $request->string('id_number')->toString())
            ->latest()
            ->first();

        if ($admission === null) {
            return back()
                ->withInput()
                ->withErrors([
                    'email' => 'No encontramos una solicitud con ese correo y cédula. Verifica los datos e inténtalo de nuevo.',
                ]);
        }

        return redirect()->to(
            $admission->trackingUrl((int) config('admissions.tracking_days')),
        );
    }
}
