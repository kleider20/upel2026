<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAdmissionWindowRequest;
use App\Models\AdmissionWindowSetting;
use Illuminate\Http\RedirectResponse;

class AdminAdmissionWindowController extends Controller
{
    /**
     * Actualiza las fechas y el estado manual de la ventana de inscripciones.
     */
    public function update(UpdateAdmissionWindowRequest $request): RedirectResponse
    {
        AdmissionWindowSetting::current()->update($request->validated());

        return back()->with('success', 'La ventana de inscripciones se actualizó correctamente.');
    }
}
