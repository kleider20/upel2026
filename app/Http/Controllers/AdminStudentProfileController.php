<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Enums\Role;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Models\AdmissionDocument;
use App\Models\Career;
use App\Models\StudentProfile;
use App\Support\AcademicOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminStudentProfileController extends Controller
{
    /**
     * Muestra el perfil administrativo y, con permiso de admisiones, su expediente documental.
     */
    public function show(Request $request, StudentProfile $student): Response
    {
        $this->authorizeAdmin($request);

        $canViewDocuments = $request->user()?->can(Permission::AdmissionsView->value) ?? false;
        $student->load(['career', 'user']);

        if ($canViewDocuments) {
            $student->load([
                'user.admission.documents' => static fn ($query) => $query->orderBy('type'),
            ]);
        }

        $admission = $canViewDocuments ? $student->user->admission : null;

        return Inertia::render('admin/students/show', [
            'student' => [
                'name' => $student->user->name,
                'email' => $student->user->email,
                'student_code' => $student->student_code,
                'career' => $student->career?->name,
                'semester' => $student->current_semester,
                'status' => $student->statusLabel(),
                'phone' => $student->phone,
                'address' => $student->address,
                'edit_url' => route('admin.students.edit', ['student' => $student->student_code]),
                'delete_url' => route('admin.students.destroy', ['student' => $student->student_code]),
            ],
            'can_view_documents' => $canViewDocuments,
            'document_folder' => $canViewDocuments && $admission !== null
                ? $admission->formattedIdNumber()
                : null,
            'documents' => $canViewDocuments && $admission !== null
                ? $admission->documents->map(
                    static fn (AdmissionDocument $document): array => [
                        'id' => $document->id,
                        'type_label' => $document->typeLabel(),
                        'status_label' => $document->statusLabel(),
                        'status_tone' => $document->statusTone(),
                        'original_name' => $document->original_name,
                        'size' => $document->humanSize(),
                        'is_previewable' => $document->isPreviewable(),
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
