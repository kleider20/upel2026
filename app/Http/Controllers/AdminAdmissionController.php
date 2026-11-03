<?php

namespace App\Http\Controllers;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Enums\Role;
use App\Http\Requests\ReviewAdmissionDocumentRequest;
use App\Http\Requests\UpdateAdmissionStatusRequest;
use App\Mail\AdmissionConverted;
use App\Mail\AdmissionStatusChanged;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\StudentCodeGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAdmissionController extends Controller
{
    /**
     * Bandeja de solicitudes con filtros y resumen.
     */
    public function index(Request $request): Response
    {
        $this->authorizeView($request);

        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $status = AdmissionStatus::tryFrom($status) !== null ? $status : null;
        $search = trim($search) !== '' ? $search : null;

        $admissions = Admission::query()
            ->with('career')
            ->ofStatus($status)
            ->search($search)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(static fn (Admission $admission): array => [
                'id' => $admission->id,
                'code' => $admission->code,
                'applicant' => $admission->fullName(),
                'id_number' => $admission->formattedIdNumber(),
                'email' => $admission->email,
                'career' => $admission->career?->name ?? '—',
                'modality' => $admission->modalityLabel(),
                'average' => number_format((float) $admission->high_school_average, 2, ',', '.'),
                'status' => $admission->status,
                'status_label' => $admission->statusLabel(),
                'status_tone' => $admission->statusTone(),
                'submitted_at' => $admission->created_at?->format('d/m/Y'),
                'url' => route('admin.admissions.show', ['admission' => $admission->code]),
            ]);

        return Inertia::render('admin/admissions/index', [
            'admissions' => $admissions,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'statuses' => array_map(
                static fn (AdmissionStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ],
                AdmissionStatus::cases(),
            ),
            'stats' => [
                ['label' => 'Solicitudes', 'value' => (string) Admission::query()->count(), 'tone' => 'blue'],
                [
                    'label' => 'Por revisar',
                    'value' => (string) Admission::query()
                        ->whereIn('status', [
                            AdmissionStatus::Recibida->value,
                            AdmissionStatus::EnRevision->value,
                        ])
                        ->count(),
                    'tone' => 'amber',
                ],
                [
                    'label' => 'Aprobadas',
                    'value' => (string) Admission::query()
                        ->whereIn('status', [
                            AdmissionStatus::Aprobada->value,
                            AdmissionStatus::Convertida->value,
                        ])
                        ->count(),
                    'tone' => 'green',
                ],
                [
                    'label' => 'Observadas',
                    'value' => (string) Admission::query()
                        ->where('status', AdmissionStatus::Observada->value)
                        ->count(),
                    'tone' => 'gold',
                ],
            ],
        ]);
    }

    /**
     * Expediente completo de una solicitud.
     */
    public function show(Request $request, Admission $admission): Response
    {
        $this->authorizeView($request);

        $admission->load([
            'career',
            'documents' => static fn ($query) => $query->orderBy('type'),
            'documents.reviewer',
            'statusHistories.changedBy',
            'reviewer',
            'convertedUser',
        ]);

        return Inertia::render('admin/admissions/show', [
            'admission' => $this->present($admission),
            'transitions' => array_map(
                static fn (AdmissionStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ],
                array_values(array_filter(
                    $admission->statusEnum()->transitions(),
                    static fn (AdmissionStatus $status): bool => $status !== AdmissionStatus::Convertida,
                )),
            ),
            'documentStatuses' => [
                ['value' => AdmissionDocumentStatus::Validado->value, 'label' => AdmissionDocumentStatus::Validado->label()],
                ['value' => AdmissionDocumentStatus::Rechazado->value, 'label' => AdmissionDocumentStatus::Rechazado->label()],
            ],
        ]);
    }

    /**
     * Cambia el estado de la solicitud y notifica al aspirante.
     */
    public function updateStatus(UpdateAdmissionStatusRequest $request, Admission $admission): RedirectResponse
    {
        $target = AdmissionStatus::from($request->string('status')->toString());
        $previous = $admission->statusEnum();
        $note = $request->string('note')->trim()->toString();

        DB::transaction(function () use ($admission, $request, $target, $previous, $note): void {
            $admission->update([
                'status' => $target->value,
                'review_notes' => $note !== '' ? $note : $admission->review_notes,
                'reviewed_by' => $request->user()?->id,
                'reviewed_at' => now(),
            ]);

            $admission->statusHistories()->create([
                'from_status' => $previous->value,
                'to_status' => $target->value,
                'note' => $note !== '' ? $note : null,
                'changed_by' => $request->user()?->id,
            ]);
        });

        Mail::to($admission->email)->queue(
            new AdmissionStatusChanged($admission->refresh(), $previous, $note !== '' ? $note : null),
        );

        return back()->with('success', 'La solicitud pasó a "'.$target->label().'".');
    }

    /**
     * Convierte al aspirante aprobado en estudiante con cuenta y perfil.
     */
    public function convert(
        Request $request,
        Admission $admission,
        StudentCodeGenerator $codes,
    ): RedirectResponse {
        abort_unless(
            $request->user()?->can(Permission::AdmissionsManage->value),
            403,
        );

        abort_unless(
            $admission->canBeConverted(),
            422,
            'Solo las solicitudes aprobadas y no convertidas pueden generar un estudiante.',
        );

        if (User::query()->where('email', $admission->email)->exists()) {
            return back()->withErrors([
                'conversion' => 'Ya existe una cuenta con el correo '.$admission->email.'. Revisa el expediente antes de convertir.',
            ]);
        }

        $user = DB::transaction(function () use ($admission, $codes): User {
            $user = User::query()->create([
                'name' => $admission->fullName(),
                'email' => $admission->email,
                'password' => $admission->id_number,                'must_change_password' => true,
            ]);

            $user->markEmailAsVerified();
            $user->assignRole(Role::Estudiante->value);

            StudentProfile::query()->create([
                'user_id' => $user->id,
                'career_id' => $admission->career_id,
                'student_code' => $codes->generate($admission->period_year),
                'current_semester' => 1,
                'status' => 'activo',
                'phone' => $admission->phone,
                'personal_email' => $admission->email,
                'address' => $admission->address,
                'birth_date' => $admission->birth_date,
                'shift' => $admission->shiftLabel(),
                'admission_year' => $admission->period_year,
            ]);

            $admission->update([
                'status' => AdmissionStatus::Convertida->value,
                'converted_user_id' => $user->id,
                'converted_at' => now(),
            ]);

            $admission->statusHistories()->create([
                'from_status' => AdmissionStatus::Aprobada->value,
                'to_status' => AdmissionStatus::Convertida->value,
                'note' => 'Se creó la cuenta de estudiante y su expediente académico.',
                'changed_by' => auth()->id(),
            ]);

            return $user;
        });

        Mail::to($user->email)->queue(
            new AdmissionConverted($admission->refresh(), $user),
        );

        return back()->with(
            'success',
            'Estudiante creado con el código '.$user->studentProfile?->student_code.'. Se envió el correo de acceso.',
        );
    }

    /**
     * Descarga un documento del expediente.
     */
    public function downloadDocument(
        Request $request,
        Admission $admission,
        AdmissionDocument $document,
    ): StreamedResponse {
        $this->authorizeView($request);

        abort_unless($document->admission_id === $admission->id, 404);

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($document->path), 404, 'El archivo ya no está disponible.');

        return $disk->download($document->path, $document->original_name);
    }

    /**
     * Muestra un documento del expediente en el navegador.
     */
    public function previewDocument(
        Request $request,
        Admission $admission,
        AdmissionDocument $document,
    ): StreamedResponse {
        $this->authorizeView($request);

        abort_unless($document->admission_id === $admission->id, 404);

        abort_unless($document->isPreviewable(), 404);

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($document->path), 404, 'El archivo ya no está disponible.');

        return $disk->response($document->path, $document->original_name);
    }

    /**
     * Valida o rechaza un documento del expediente.
     */
    public function reviewDocument(
        ReviewAdmissionDocumentRequest $request,
        Admission $admission,
        AdmissionDocument $document,
    ): RedirectResponse {
        abort_unless($document->admission_id === $admission->id, 404);

        $status = AdmissionDocumentStatus::from($request->string('status')->toString());
        $notes = $request->string('notes')->trim()->toString();

        $document->update([
            'status' => $status->value,
            'notes' => $notes !== '' ? $notes : null,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
        ]);

        return back()->with(
            'success',
            'El documento "'.$document->typeLabel().'" quedó como '.$status->label().'.',
        );
    }

    /**
     * Verifica el permiso de lectura del módulo.
     */
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()?->can(Permission::AdmissionsView->value),
            403,
            'No tienes permiso para acceder a las admisiones.',
        );
    }

    /**
     * Estructura el expediente para la vista administrativa.
     *
     * @return array<string, mixed>
     */
    private function present(Admission $admission): array
    {
        return [
            'id' => $admission->id,
            'code' => $admission->code,
            'status' => $admission->status,
            'status_label' => $admission->statusLabel(),
            'status_tone' => $admission->statusTone(),
            'status_description' => $admission->statusEnum()->description(),
            'full_name' => $admission->fullName(),
            'first_name' => $admission->first_name,
            'last_name' => $admission->last_name,
            'nationality' => $admission->nationality,
            'id_number' => $admission->id_number,
            'formatted_id_number' => $admission->formattedIdNumber(),
            'birth_date' => $admission->birth_date->format('d/m/Y'),
            'age' => $admission->age(),
            'gender' => $admission->gender,
            'email' => $admission->email,
            'phone' => $admission->phone,
            'address' => $admission->address,
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
            'reviewed_at' => $admission->reviewed_at?->format('d/m/Y h:i A'),
            'reviewer' => $admission->reviewer?->name,
            'review_notes' => $admission->review_notes,
            'missing_documents' => array_map(
                static fn (AdmissionDocumentType $type): string => $type->label(),
                $admission->missingRequiredDocuments(),
            ),
            'has_complete_documents' => $admission->hasCompleteDocuments(),
            'can_convert' => $admission->canBeConverted(),
            'converted_user' => $admission->convertedUser?->name,
            'converted_at' => $admission->converted_at?->format('d/m/Y h:i A'),
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
                    'mime_type' => $document->mime_type,
                    'is_previewable' => $document->isPreviewable(),
                    'notes' => $document->notes,
                    'reviewer' => $document->reviewer?->name,
                    'uploaded_at' => $document->created_at?->format('d/m/Y h:i A'),
                    'download_url' => route('admin.admissions.documents.download', [
                        'admission' => $admission->code,
                        'document' => $document->id,
                    ]),
                    'preview_url' => route('admin.admissions.documents.preview', [
                        'admission' => $admission->code,
                        'document' => $document->id,
                    ]),
                    'review_url' => route('admin.admissions.documents.review', [
                        'admission' => $admission->code,
                        'document' => $document->id,
                    ]),
                ],
            )->values(),
            'history' => $admission->statusHistories->map(
                static fn ($history): array => [
                    'id' => $history->id,
                    'from' => $history->fromLabel(),
                    'to' => $history->toLabel(),
                    'tone' => $history->toTone(),
                    'note' => $history->note,
                    'changed_by' => $history->changedBy?->name ?? 'Sistema',
                    'date' => $history->created_at?->format('d/m/Y h:i A'),
                ],
            )->values(),
        ];
    }
}
