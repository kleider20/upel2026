<?php

namespace App\Support;

use App\Models\StudentProfile;

/**
 * Genera códigos de estudiante únicos con el formato institucional.
 */
final class StudentCodeGenerator
{
    /**
     * Código secuencial para el año de admisión, por ejemplo EST-2027-001.
     */
    public function generate(int $year): string
    {
        $prefix = sprintf('EST-%d-', $year);

        $lastCode = StudentProfile::query()
            ->where('student_code', 'like', $prefix.'%')
            ->orderByDesc('student_code')
            ->value('student_code');

        $sequence = $lastCode !== null
            ? ((int) substr($lastCode, strlen($prefix))) + 1
            : 1;

        do {
            $code = $prefix.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
            $sequence++;
        } while (StudentProfile::query()->where('student_code', $code)->exists());

        return $code;
    }
}
