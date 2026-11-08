<?php

namespace App\Support;

use App\Models\Admission;
use App\Models\StudentProfile;
use App\Models\User;

final class AdmissionIdentity
{
    /**
     * @return array<string, string>
     */
    public static function duplicateErrors(?string $idNumber, ?string $email): array
    {
        $errors = [];

        if ($idNumber !== null && $idNumber !== ''
            && Admission::query()->where('id_number', $idNumber)->exists()) {
            $errors['id_number'] = 'Ya existe una solicitud o un estudiante registrado con esta cédula.';
        }

        if ($email !== null && $email !== ''
            && (
                Admission::query()->whereRaw('LOWER(email) = ?', [$email])->exists()
                || User::query()->whereRaw('LOWER(email) = ?', [$email])->exists()
                || StudentProfile::query()
                    ->whereRaw('LOWER(personal_email) = ?', [$email])
                    ->exists()
            )) {
            $errors['email'] = 'Ya existe una cuenta o solicitud asociada a este correo.';
        }

        return $errors;
    }
}
