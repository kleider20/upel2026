<?php

namespace App\Http\Controllers\Student;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmissionDocumentRequest;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentDocumentController extends Controller
{
    /**
     * Carga o reemplaza un documento del expediente del estudiante autenticado.
     *
     * Cada reemplazo vuelve a dejar el documento pendiente de revisión.
     */
    public function store(StoreAdmissionDocumentRequest $request): RedirectResponse
    {
        $admission = $this->admission($request);

        $type = AdmissionDocumentType::from($request->string('type')->toString());
        $file = $request->file('document');
        $disk = (string) config('admissions.documents.disk');

        abort_if($file === null, 422, 'No se recibió ningún archivo.');

        $path = $file->store(
            $admission->documentsDirectoryPath().'/'.$type->value,
            $disk,
        );

        if (! is_string($path)) {
            throw new RuntimeException('No se pudo guardar el documento en el almacenamiento privado.');
        }

        $existing = $admission->documents()->where('type', $type->value)->first();

        DB::transaction(function () use ($admission, $type, $file, $path, $existing, $request): void {
            $admission->documents()->updateOrCreate(
                ['type' => $type->value],
                [
                    'status' => AdmissionDocumentStatus::Pendiente->value,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'notes' => null,
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                    'review_requested_at' => now(),
                ],
            );

            $admission->statusHistories()->create([
                'from_status' => $admission->status,
                'to_status' => $admission->status,
                'note' => $existing !== null
                    ? 'Actualizaste tu '.$type->label().' y solicitaste una nueva revisión.'
                    : 'Cargaste tu '.$type->label().' y solicitaste su revisión.',
                'changed_by' => $request->user()?->id,
            ]);
        });

        if ($existing !== null && $existing->path !== $path) {
            Storage::disk($disk)->delete($existing->path);
        }

        return back()->with('success', 'Documento cargado correctamente. Queda pendiente de revisión.');
    }

    /**
     * Muestra un documento del expediente propio en el navegador.
     */
    public function preview(Request $request, AdmissionDocument $document): StreamedResponse
    {
        $this->authorizeOwnership($request, $document);

        abort_unless($document->isPreviewable(), 404);

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($document->path), 404, 'El archivo ya no está disponible.');

        return $disk->response($document->path, $document->original_name, [
            'Cache-Control' => 'private, max-age=600',
        ]);
    }

    /**
     * Descarga un documento del expediente propio.
     */
    public function download(Request $request, AdmissionDocument $document): StreamedResponse
    {
        $this->authorizeOwnership($request, $document);

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($document->path), 404, 'El archivo ya no está disponible.');

        return $disk->download($document->path, $document->original_name);
    }

    /**
     * Solicitud de admisión vinculada al estudiante autenticado.
     */
    private function admission(Request $request): Admission
    {
        $admission = Admission::query()
            ->where('converted_user_id', $request->user()?->id)
            ->latest()
            ->first();

        abort_if($admission === null, 404, 'No tienes una solicitud de admisión vinculada.');

        return $admission;
    }

    /**
     * Impide que un estudiante acceda a documentos de otro expediente.
     */
    private function authorizeOwnership(Request $request, AdmissionDocument $document): void
    {
        $document->loadMissing('admission');

        abort_unless(
            $document->admission?->converted_user_id === $request->user()?->id,
            404,
        );
    }
}
