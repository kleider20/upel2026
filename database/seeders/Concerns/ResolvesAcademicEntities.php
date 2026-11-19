<?php

namespace Database\Seeders\Concerns;

use App\Models\AcademicPeriod;
use App\Models\Career;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\AdminSeeder;

/**
 * Resuelve las entidades académicas que los seeders consultan por código o nombre.
 */
trait ResolvesAcademicEntities
{
    /**
     * Carrera por código; falla si no existe.
     */
    protected function getCareer(string $code): Career
    {
        return Career::query()->where('code', $code)->firstOrFail();
    }

    /**
     * Carrera por código; devuelve null si no existe.
     */
    protected function getCareerOrNull(string $code): ?Career
    {
        return Career::query()->where('code', $code)->first();
    }

    /**
     * Período académico por nombre; falla si no existe.
     */
    protected function getAcademicPeriod(string $name): AcademicPeriod
    {
        return AcademicPeriod::query()->where('name', $name)->firstOrFail();
    }

    /**
     * Materia por carrera y nombre; falla si no existe.
     */
    protected function getSubject(Career $career, string $name): Subject
    {
        return Subject::query()
            ->whereBelongsTo($career)
            ->where('name', $name)
            ->firstOrFail();
    }

    /**
     * Usuario administrador del sistema; falla si no existe.
     */
    protected function getAdminUser(): User
    {
        return User::query()
            ->where('email', AdminSeeder::ADMIN_EMAIL)
            ->firstOrFail();
    }
}
