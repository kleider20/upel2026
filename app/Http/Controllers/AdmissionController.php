<?php

namespace App\Http\Controllers;

use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Http\Requests\CheckAdmissionIdentityRequest;
use App\Http\Requests\StoreAdmissionDocumentRequest;
use App\Http\Requests\StoreAdmissionRequest;
use App\Mail\AdmissionReceived;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use App\Models\AdmissionStatusHistory;
use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\HighSchool;
use App\Support\AdmissionWindow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AdmissionController extends Controller
{
    public function __construct(private AdmissionWindow $window) {}

    /**
     * Muestra el formulario público de preinscripción.
     */
    public function create(): Response
    {
        if (! $this->window->isOpen()) {
            return Inertia::render('admissions/closed', [
                'opensAt' => $this->window->opensAt()->toIso8601String(),
                'remainingDays' => $this->window->daysUntilOpen(),
                'periodYear' => $this->window->periodYear(),
            ]);
        }

        return Inertia::render('admissions/apply', [
            'careers' => Career::query()
                ->where('is_active', true)
                ->whereHas('offerings', static fn ($query) => $query->where('is_active', true))
                ->with(['offerings' => static fn ($query) => $query
                    ->where('is_active', true)
                    ->orderBy('modality')
                    ->orderBy('schedule')
                    ->orderBy('shift')])
                ->orderBy('name')
                ->get()
                ->map(static fn (Career $career): array => [
                    'id' => $career->id,
                    'name' => $career->name,
                    'code' => $career->code,
                    'modality' => $career->modality,
                    'modality_label' => $career->modalityLabel(),
                    'duration_semesters' => $career->duration_semesters,
                    'offerings' => $career->offerings
                        ->map(static fn (CareerOffering $offering): array => [
                            'modality' => $offering->modality,
                            'modality_label' => $offering->modalityLabel(),
                            'schedule' => $offering->schedule,
                            'schedule_label' => $offering->scheduleLabel(),
                            'shift' => $offering->shift,
                            'shift_label' => $offering->shiftLabel(),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values(),
            'periodYear' => $this->window->periodYear(),
            'documentTypes' => AdmissionDocumentType::options(),
            'highSchools' => HighSchool::query()
                ->orderBy('name')
                ->pluck('name')
                ->values(),
            'opensAt' => $this->window->opensAt()->toIso8601String(),
        ]);
    }

    /**
     * Comprueba que la cédula y el correo estén disponibles antes de avanzar el formulario.
     */
    public function checkIdentity(CheckAdmissionIdentityRequest $request): JsonResponse
    {
        abort_unless(
            $this->window->isOpen(),
            403,
            'La preinscripción todavía no está abierta.',
        );

        return response()->json([], 200);
    }

    /**
     * Registra la solicitud y envía el correo de confirmación.
     */
    public function store(StoreAdmissionRequest $request): RedirectResponse
    {
        abort_unless(
            $this->window->isOpen(),
            403,
            'La preinscripción todavía no está abierta.',
        );

        $data = Arr::except($request->validated(), ['terms']);
        $periodYear = $this->window->periodYear();

        $admission = DB::transaction(function () use ($data, $periodYear): Admission {
            HighSchool::query()->firstOrCreate([
                'name' => $data['high_school'],
            ]);

            $admission = Admission::query()->create([
                ...$data,
                'code' => Admission::nextCode($periodYear),
                'period_year' => $periodYear,
                'status' => AdmissionStatus::Recibida->value,
                'submitted_at' => now(),
            ]);

            $disk = Storage::disk((string) config('admissions.documents.disk'));

            if (! $disk->makeDirectory($admission->documentsDirectoryPath())) {
                throw new RuntimeException('No se pudo crear la carpeta privada del expediente de admisión.');
            }

            $admission->statusHistories()->create([
                'from_status' => null,
                'to_status' => AdmissionStatus::Recibida->value,
                'note' => 'Solicitud recibida desde el formulario público.',
                'changed_by' => null,
            ]);

            return $admission;
        });

        Mail::to($admission->email)->queue(new AdmissionReceived($admission));

        return redirect()
            ->to($admission->trackingUrl((int) config('admissions.tracking_days')))
            ->with('success', '¡Solicitud recibida! Guarda tu código de aspirante para consultar el estado.');
    }

    /**
     * Muestra el estado de una solicitud a través del enlace firmado.
     */
    public function show(Admission $admission): Response
    {
        $admission->load([
            'career',
            'documents' => static fn ($query) => $query->orderBy('type'),
            'documents.reviewer',
            'statusHistories.changedBy',
            'convertedUser.studentProfile',
        ]);

        return Inertia::render('admissions/status', [
            'admission' => $this->present($admission),
            'documentTypes' => AdmissionDocumentType::options(),
        ]);
    }

    /**
     * Genera un enlace de acceso al campus para el aspirante ya convertido.
     */
    /**
     * Carga o reemplaza un documento del expediente.
     */
    public function storeDocument(StoreAdmissionDocumentRequest $request, Admission $admission): RedirectResponse
    {
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

        $admission->documents()->updateOrCreate(
            ['type' => $type->value],
            [
                'status' => 'pendiente',
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'notes' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ],
        );

        if ($existing !== null && $existing->path !== $path) {
            Storage::disk($disk)->delete($existing->path);
        }

        return back()->with('success', 'Documento cargado correctamente. Queda pendiente de revisión.');
    }

    /**
     * Elimina un documento mientras la solicitud esté abierta.
     */
    public function destroyDocument(Admission $admission, AdmissionDocument $document): RedirectResponse
    {
        abort_unless($document->admission_id === $admission->id, 404);

        abort_unless(
            $admission->statusEnum()->allowsDocumentUpload(),
            403,
            'Esta solicitud ya no admite cambios en los documentos.',
        );

        Storage::disk((string) config('admissions.documents.disk'))->delete($document->path);
        $document->delete();

        return back()->with('success', 'Documento eliminado. Puedes subir uno nuevo.');
    }

    /**
     * Estructura la solicitud para la página de seguimiento.
     *
     * @return array<string, mixed>
     */
    private function present(Admission $admission): array
    {
        $trackingDays = (int) config('admissions.tracking_days');

        return [
            'code' => $admission->code,
            'status' => $admission->status,
            'status_label' => $admission->statusLabel(),
            'status_tone' => $admission->statusTone(),
            'status_description' => $admission->statusEnum()->description(),
            'full_name' => $admission->fullName(),
            'id_number' => $admission->formattedIdNumber(),
            'email' => $admission->email,
            'phone' => $admission->phone,
            'birth_date' => $admission->birth_date->format('d/m/Y'),
            'career' => $admission->career?->name,
            'career_code' => $admission->career?->code,
            'modality' => $admission->modalityLabel(),
            'schedule' => $admission->scheduleLabel(),
            'shift' => $admission->shiftLabel(),
            'high_school' => $admission->high_school,
            'high_school_year' => $admission->high_school_year,
            'high_school_average' => number_format((float) $admission->high_school_average, 2, ',', '.'),
            'period_year' => $admission->period_year,
            'submitted_at' => $admission->submitted_at?->format('d/m/Y h:i A'),
            'review_notes' => $admission->review_notes,
            'can_upload' => $admission->statusEnum()->allowsDocumentUpload(),
            'missing_documents' => array_map(
                static fn (AdmissionDocumentType $type): string => $type->label(),
                $admission->missingRequiredDocuments(),
            ),
            'documents' => $admission->documents->map(
                static fn (AdmissionDocument $document): array => [
                    'id' => $document->id,
                    'type' => $document->type,
                    'type_label' => $document->typeLabel(),
                    'status' => $document->status,
                    'status_label' => $document->statusLabel(),
                    'status_tone' => $document->statusTone(),
                    'original_name' => $document->original_name,
                    'size' => $document->humanSize(),
                    'notes' => $document->notes,
                    'uploaded_at' => $document->updated_at?->format('d/m/Y'),
                    'delete_url' => URL::temporarySignedRoute(
                        'admissions.documents.destroy',
                        now()->addDays($trackingDays),
                        ['admission' => $admission->code, 'document' => $document->id],
                    ),
                ],
            )->values(),
            'history' => $admission->statusHistories->map(
                static function (AdmissionStatusHistory $history): array {
                    $isDocumentReview = $history->from_status === $history->to_status
                        && $history->note !== null;

                    return [
                        'id' => $history->id,
                        'from' => $history->fromLabel(),
                        'to' => $history->toLabel(),
                        'title' => $isDocumentReview ? $history->note : $history->toLabel(),
                        'tone' => $history->toTone(),
                        'note' => $isDocumentReview ? null : $history->note,
                        'changed_by' => data_get($history->changedBy, 'name') ?? 'Sistema',
                        'date' => $history->created_at?->format('d/m/Y h:i A'),
                    ];
                },
            )->values(),
            'upload_url' => URL::temporarySignedRoute(
                'admissions.documents.store',
                now()->addDays($trackingDays),
                ['admission' => $admission->code],
            ),
            'student' => $this->studentAccess($admission),
        ];
    }

    /**
     * Datos de acceso del estudiante cuando la solicitud ya fue convertida.
     *
     * @return array<string, mixed>|null
     */
    private function studentAccess(Admission $admission): ?array
    {
        if ($admission->statusEnum() !== AdmissionStatus::Convertida || $admission->convertedUser === null) {
            return null;
        }

        $user = $admission->convertedUser;

        return [
            'name' => $user->name,
            'email' => $user->email,
            'student_code' => $user->studentProfile?->student_code,
            'career' => $admission->career?->name,
            'period_year' => $admission->period_year,
            'converted_at' => $admission->converted_at?->format('d/m/Y h:i A'),
            'initial_password' => $user->needsPasswordChange() ? $admission->id_number : null,
            'login_url' => route('login'),
        ];
    }
}
