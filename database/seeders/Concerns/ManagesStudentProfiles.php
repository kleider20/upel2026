<?php

namespace Database\Seeders\Concerns;

use App\Models\Career;
use App\Models\StudentProfile;
use App\Models\User;

/**
 * Crea o actualiza el perfil académico de un estudiante.
 */
trait ManagesStudentProfiles
{
    /**
     * Perfil del estudiante asociado a su cuenta.
     *
     * Los campos opcionales que llegan en null se omiten para no borrar datos
     * ya cargados por otros seeders al volver a sembrar.
     */
    protected function createStudentProfile(
        User $user,
        Career $career,
        string $studentCode,
        int $semester,
        string $status = 'activo',
        ?int $admissionYear = null,
        ?int $graduationYear = null,
        ?string $identityDocument = null,
        ?string $cohort = null,
        ?string $personalEmail = null,
    ): StudentProfile {
        $attributes = array_filter(
            [
                'career_id' => $career->id,
                'student_code' => $studentCode,
                'current_semester' => $semester,
                'status' => $status,
                'admission_year' => $admissionYear,
                'graduation_year' => $graduationYear,
                'identity_document' => $identityDocument,
                'cohort' => $cohort,
                'personal_email' => $personalEmail,
            ],
            static fn (mixed $value): bool => $value !== null,
        );

        return StudentProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            $attributes,
        );
    }
}
