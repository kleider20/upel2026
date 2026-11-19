<?php

namespace Database\Seeders\Users\Professors;

use App\Enums\Role as RoleEnum;

class AmadaPrimSeeder extends BaseProfessorAdministrativeSeeder
{
    /**
     * {@inheritDoc}
     */
    protected function name(): string
    {
        return 'Amada Prim';
    }

    /**
     * {@inheritDoc}
     */
    protected function email(): string
    {
        return 'amada.prim@upel.edu.ve';
    }

    /**
     * {@inheritDoc}
     */
    protected function password(): string
    {
        return 'DecanoProfesor12345!';
    }

    /**
     * {@inheritDoc}
     */
    protected function roles(): array
    {
        return [
            RoleEnum::Profesor,
            RoleEnum::Decano,
        ];
    }

    /**
     * {@inheritDoc}
     */
    protected function professorProfile(): array
    {
        return [
            'employee_code' => 'PROF-DEC-001',
            'identity_document' => 'V-12.345.678',
            'department' => 'Decanato',
            'academic_title' => 'Doctora en Educación',
        ];
    }
}
