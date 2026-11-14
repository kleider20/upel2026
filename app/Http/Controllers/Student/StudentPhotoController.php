<?php

namespace App\Http\Controllers\Student;

use App\Enums\AdmissionDocumentType;
use App\Http\Controllers\Controller;
use App\Models\AdmissionDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentPhotoController extends Controller
{
    /**
     * Muestra la fotografía tipo carnet que el estudiante cargó en su expediente.
     */
    public function __invoke(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStudent(), 403);

        $photo = AdmissionDocument::query()
            ->where('type', AdmissionDocumentType::Foto->value)
            ->whereHas('admission', static fn ($query) => $query->where('converted_user_id', $user->id))
            ->latest('id')
            ->first();

        abort_if($photo === null, 404, 'El expediente no tiene una fotografía tipo carnet cargada.');

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($photo->path), 404, 'La fotografía ya no está disponible.');

        return $disk->response($photo->path, $photo->original_name, [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
