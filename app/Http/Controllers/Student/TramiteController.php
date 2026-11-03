<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TramiteController extends Controller
{
    /**
     * Almacena una nueva solicitud de trámite o constancia del estudiante.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null || ! $user->isStudent()) {
            return redirect()->route('login');
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:constancia_estudios,constancia_notas,solvencia,record_academico'],
        ]);

        $labels = [
            'constancia_estudios' => 'Constancia de Estudios',
            'constancia_notas' => 'Constancia de Notas',
            'solvencia' => 'Solvencia Institucional',
            'record_academico' => 'Récord Académico Certificado',
        ];

        $tramites = session()->get('student_tramites', []);

        array_unshift($tramites, [
            'id' => count($tramites) + 1,
            'type' => $validated['type'],
            'type_label' => $labels[$validated['type']] ?? 'Trámite Académico',
            'status' => 'pendiente',
            'status_label' => 'En proceso',
            'status_tone' => 'amber',
            'created_at' => now()->format('d/m/Y'),
        ]);

        session()->put('student_tramites', $tramites);

        return back()->with('success', '✅ Solicitud enviada correctamente. El departamento la procesará en breve.');
    }
}
