<?php

namespace App\Support;

use App\Enums\AdmissionDocumentType;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use App\Models\StudentProfile;

/**
 * Separa la información pública del perfil estudiantil de la reservada al
 * propio estudiante y a los roles con permiso para verla.
 */
final class StudentProfilePrivacy
{
    /**
     * Datos visibles para cualquier usuario con acceso al perfil.
     *
     * @return array{name: string, photo_url: string|null, career: string|null, period_year: int|null, semester: int, shift: string|null, average: float|null}
     */
    public static function publicData(
        StudentProfile $profile,
        ?Admission $admission,
        ?float $average,
    ): array {
        return [
            'name' => $profile->user->name,
            'photo_url' => self::photoUrl($profile, $admission),
            'career' => $profile->career?->name,
            'period_year' => $admission !== null ? $admission->period_year : $profile->admission_year,
            'semester' => (int) $profile->current_semester,
            'shift' => $profile->shift ?? $admission?->shiftLabel(),
            'average' => $average !== null ? round($average, 1) : null,
        ];
    }

    /**
     * URL pública de la fotografía tipo carnet del expediente.
     */
    public static function photoUrl(StudentProfile $profile, ?Admission $admission): ?string
    {
        $hasPhoto = $admission?->documents->contains(
            static fn (AdmissionDocument $document): bool => $document->type === AdmissionDocumentType::Foto->value,
        ) === true;

        return $hasPhoto
            ? route('admin.students.photo', ['student' => $profile->student_code])
            : null;
    }

    /**
     * Datos restringidos al estudiante y a los roles autorizados.
     *
     * @return array<string, mixed>
     */
    public static function privateData(StudentProfile $profile, ?Admission $admission): array
    {
        return [
            'student_code' => $profile->student_code,
            'email' => $profile->user->email,
            'personal_email' => $profile->personal_email ?? $admission?->email,
            'phone' => $profile->phone ?? $admission?->phone,
            'address' => $profile->address ?? $admission?->address,
            'emergency_contact' => $profile->emergency_contact,
            'birth_date' => ($profile->birth_date ?? $admission?->birth_date)?->format('d/m/Y'),
            'birth_place' => $profile->birth_place,
            'id_number' => $admission?->formattedIdNumber(),
            'nationality' => $admission?->nationalityLabel(),
            'gender' => $admission?->genderLabel(),
            'status' => $profile->statusLabel(),
            'status_tone' => $profile->statusTone(),
            'advisor' => $profile->advisor,
            'modality' => $admission?->modalityLabel(),
            'schedule' => $admission?->scheduleLabel(),
            'admission_code' => $admission?->code,
            'admission_status' => $admission?->statusLabel(),
            'admission_status_tone' => $admission?->statusTone(),
            'high_school' => $admission?->high_school,
            'high_school_year' => $admission?->high_school_year,
            'high_school_average' => $admission !== null
                ? number_format((float) $admission->high_school_average, 2, ',', '.')
                : null,
            'review_notes' => $admission?->review_notes,
            'admission_year' => $profile->admission_year,
            'graduation_year' => $profile->graduation_year,
        ];
    }
}
