<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfessorProfileRequest;
use App\Models\ProfessorProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfessorProfileController extends Controller
{
    /**
     * Ficha del docente: datos de su cuenta y los campos que publica en la
     * sección "Profesionales que inspiran" de la landing.
     */
    public function edit(Request $request): Response
    {
        $professor = $this->professorProfile($request);
        $professor->loadMissing('user');

        return Inertia::render('dashboard/professor/profile', [
            'profile' => [
                'id' => $professor->id,
                'name' => $professor->user->name,
                'email' => $professor->user->email,
                'employee_code' => $professor->employee_code,
                'identity_document' => $professor->identity_document,
                'department' => $professor->department,
                'academic_title' => $professor->academic_title,
                'position' => $professor->position,
                'bio' => $professor->bio,
                'photo_url' => $professor->photoUrl(),
            ],
        ]);
    }

    /**
     * Guarda los datos públicos del perfil y su fotografía tipo carnet.
     */
    public function update(UpdateProfessorProfileRequest $request): RedirectResponse
    {
        $professor = $this->professorProfile($request);
        $data = $request->validated();
        $photo = $request->file('photo');

        if ($photo !== null) {
            $this->deletePhoto($professor->photo_path);
            $data['photo_path'] = $photo->store('professors', 'public');
        } elseif ($request->boolean('remove_photo')) {
            $this->deletePhoto($professor->photo_path);
            $data['photo_path'] = null;
        }

        unset($data['photo'], $data['remove_photo']);

        $professor->update($data);

        return redirect()
            ->route('professor.profile.edit')
            ->with('success', 'Tu perfil docente fue actualizado. Los cambios ya se muestran en la landing.');
    }

    /**
     * Perfil docente de la cuenta autenticada.
     */
    private function professorProfile(Request $request): ProfessorProfile
    {
        $user = $request->user();

        abort_unless(
            $user instanceof User && $user->isProfessor(),
            403,
            'Este perfil es exclusivo de los docentes.',
        );

        $professor = $user->professorProfile()->first();

        abort_if(
            $professor === null,
            404,
            'Tu cuenta aún no tiene un perfil docente registrado.',
        );

        return $professor;
    }

    /**
     * Elimina del disco público la fotografía anterior del docente.
     */
    private function deletePhoto(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }
}
