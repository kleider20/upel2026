<?php

namespace App\Http\Controllers;

use App\Enums\AdmissionDocumentStatus;
use App\Enums\AdmissionDocumentType;
use App\Enums\AdmissionStatus;
use App\Enums\Permission;
use App\Enums\Role;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Models\AdmissionDocument;
use App\Models\Career;
use App\Models\StudentProfile;
use App\Support\AcademicOptions;
use App\Support\AdmissionTimeline;
use App\Support\StudentProfilePrivacy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminStudentProfileController extends Controller
{
    /**
     * Muestra el perfil del estudiante. Los datos privados solo se exponen a
     * quien tenga el permiso correspondiente.
     */
    public function show(Request $request, StudentProfile $student): Response
    {
        $user = $request->user();

        abort_unless(
            $user?->can(Permission::StudentsView->value),
            403,
            'No tienes permiso para consultar expedientes de estudiantes.',
        );

        $canViewPrivate = $user->can(Permission::StudentsViewPrivate->value);
        $canViewDocuments = $canViewPrivate && $user->can(Permission::AdmissionsView->value);
        $canReviewRequests = $user->can(Permission::AdmissionsManage->value)
            || $user->can(Permission::AdmissionsReview->value);
        $canUpdateStatus = $canViewPrivate && $canReviewRequests;
        $canReviewDocuments = $canViewDocuments && $canReviewRequests;
        $canManage = $user->hasRole(Role::Admin->value);

        $student->load([
            'career',
            'user',
            'admission.reviewer',
            'admission.statusHistories.changedBy',
            'admission.documents' => static fn ($query) => $query->orderBy('type'),
            'admission.documents.reviewer',
        ]);

        $admission = $student->admission;
        $average = $student->enrollments()->whereNotNull('final_grade')->avg('final_grade');

        return Inertia::render('admin/students/show', [
            'student' => StudentProfilePrivacy::publicData(
                $student,
                $admission,
                $average !== null ? (float) $average : null,
            ),
            'private' => $canViewPrivate
                ? StudentProfilePrivacy::privateData($student, $admission)
                : null,
            'can_view_private' => $canViewPrivate,
            'can_manage' => $canManage,
            'can_view_documents' => $canViewDocuments,
            'can_update_status' => $canUpdateStatus,
            'can_review_documents' => $canReviewDocuments,
            'document_statuses' => $canReviewDocuments
                ? [
                    ['value' => AdmissionDocumentStatus::Validado->value, 'label' => AdmissionDocumentStatus::Validado->label()],
                    ['value' => AdmissionDocumentStatus::Rechazado->value, 'label' => AdmissionDocumentStatus::Rechazado->label()],
                ]
                : [],
            'status_update' => $canUpdateStatus && $admission !== null
                ? [
                    'url' => route('admin.admissions.status', ['admission' => $admission->code]),
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
                ]
                : null,
            'status_description' => $admission?->statusEnum()->description(),
            'status_reviewed_at' => $admission?->reviewed_at?->format('d/m/Y h:i A'),
            'status_reviewer' => $admission?->reviewer?->name,
            'history' => $canViewPrivate && $admission !== null
                ? AdmissionTimeline::present($admission->statusHistories)
                : [],
            'document_folder' => $canViewDocuments && $admission !== null
                ? $admission->formattedIdNumber()
                : null,
            'documents' => $canViewDocuments && $admission !== null
                ? $admission->documents->map(
                    static fn (AdmissionDocument $document): array => [
                        'id' => $document->id,
                        'type_label' => $document->typeLabel(),
                        'status' => $document->status,
                        'status_label' => $document->statusLabel(),
                        'status_tone' => $document->statusTone(),
                        'original_name' => $document->original_name,
                        'size' => $document->humanSize(),
                        'uploaded_at' => $document->created_at?->format('d/m/Y'),
                        'is_previewable' => $document->isPreviewable(),
                        'notes' => $document->notes,
                        'reviewer' => $document->reviewer?->name,
                        'reviewed_at' => $document->reviewed_at?->format('d/m/Y'),
                        'review_requested' => $document->review_requested_at !== null,
                        'review_action_url' => route('admin.admissions.documents.review', [
                            'admission' => $admission->code,
                            'document' => $document->id,
                        ]),
                        'download_url' => route('admin.admissions.documents.download', [
                            'admission' => $admission->code,
                            'document' => $document->id,
                        ]),
                        'preview_url' => route('admin.admissions.documents.preview', [
                            'admission' => $admission->code,
                            'document' => $document->id,
                        ]),
                    ],
                )->values()
                : [],
            'edit_url' => $canManage
                ? route('admin.students.edit', ['student' => $student->student_code])
                : null,
            'delete_url' => $canManage
                ? route('admin.students.destroy', ['student' => $student->student_code])
                : null,
        ]);
    }

    /**
     * Muestra la fotografía tipo carnet, que forma parte de la información pública.
     */
    public function photo(Request $request, StudentProfile $student): StreamedResponse
    {
        abort_unless(
            $request->user()?->can(Permission::StudentsView->value),
            403,
            'No tienes permiso para consultar expedientes de estudiantes.',
        );

        $photo = AdmissionDocument::query()
            ->where('type', AdmissionDocumentType::Foto->value)
            ->whereHas('admission', static fn ($query) => $query->where('converted_user_id', $student->user_id))
            ->latest('id')
            ->first();

        abort_if($photo === null, 404, 'El expediente no tiene una fotografía tipo carnet cargada.');

        $disk = Storage::disk((string) config('admissions.documents.disk'));

        abort_unless($disk->exists($photo->path), 404, 'La fotografía ya no está disponible.');

        return $disk->response($photo->path, $photo->original_name, [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Muestra el formulario para corregir datos personales y académicos.
     */
    public function edit(Request $request, StudentProfile $student): Response
    {
        $this->authorizeAdmin($request);
        $student->load(['career', 'user']);

        return Inertia::render('admin/students/edit', [
            'student' => [
                'name' => $student->user->name,
                'email' => $student->user->email,
                'student_code' => $student->student_code,
                'career_id' => $student->career_id,
                'current_semester' => $student->current_semester,
                'status' => $student->status,
                'phone' => $student->phone ?? '',
                'personal_email' => $student->personal_email ?? '',
                'address' => $student->address ?? '',
                'birth_date' => $student->birth_date?->format('Y-m-d') ?? '',
                'birth_place' => $student->birth_place ?? '',
                'emergency_contact' => $student->emergency_contact ?? '',
                'shift' => $student->shift ?? '',
                'advisor' => $student->advisor ?? '',
                'admission_year' => $student->admission_year,
                'graduation_year' => $student->graduation_year,
            ],
            'careers' => Career::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(static fn (Career $career): array => [
                    'value' => (string) $career->id,
                    'label' => $career->name,
                ])
                ->values(),
            'statuses' => [
                ['value' => 'activo', 'label' => 'Activo'],
                ['value' => 'preinscrito', 'label' => 'Preinscrito'],
                ['value' => 'suspendido', 'label' => 'Suspendido'],
                ['value' => 'egresado', 'label' => 'Egresado'],
            ],
            'shifts' => AcademicOptions::shiftOptions(),
            'update_url' => route('admin.students.update', ['student' => $student->student_code]),
            'show_url' => route('admin.students.show', ['student' => $student->student_code]),
        ]);
    }

    /**
     * Actualiza los datos personales y académicos del estudiante.
     */
    public function update(UpdateStudentProfileRequest $request, StudentProfile $student): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $student): void {
            $student->user->update(Arr::only($data, ['name', 'email']));
            $student->update(Arr::except($data, ['name', 'email']));
        });

        return redirect()
            ->route('admin.students.show', ['student' => $student->fresh()->student_code])
            ->with('success', 'Los datos del estudiante fueron actualizados correctamente.');
    }

    /**
     * Elimina permanentemente la cuenta y sus datos relacionados.
     */
    public function destroy(Request $request, StudentProfile $student): RedirectResponse
    {
        $this->authorizeAdmin($request);
        $student->load('user');
        abort_if(
            $student->user->hasRole(Role::Admin->value)
                || $student->user->is($request->user()),
            403,
            'No se puede eliminar la cuenta de un administrador.',
        );

        DB::transaction(function () use ($student): void {
            $student->user->notifications()->delete();
            $student->user->delete();
        });

        return redirect()
            ->route('admin.module', ['module' => 'students'])
            ->with('success', 'La cuenta y los datos relacionados del estudiante fueron eliminados permanentemente.');
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasRole(Role::Admin->value),
            403,
            'Solo el administrador puede administrar perfiles de estudiantes.',
        );
    }
}
