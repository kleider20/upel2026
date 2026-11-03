<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Date;

/**
 * Reglas de la ventana oficial de preinscripción e inscripción.
 *
 * Centraliza las fechas para que la landing, el formulario público y las
 * pruebas compartan exactamente el mismo cálculo.
 */
final class AdmissionWindow
{
    /**
     * Inicio de la preinscripción.
     */
    public function opensAt(): CarbonInterface
    {
        return Date::parse((string) config('admissions.opens_at'));
    }

    /**
     * Inicio de la inscripción formal.
     */
    public function enrollmentOpensAt(): CarbonInterface
    {
        return Date::parse((string) config('admissions.enrollment_opens_at'));
    }

    /**
     * Meta de graduación institucional.
     */
    public function graduationAt(): CarbonInterface
    {
        return Date::parse((string) config('admissions.graduation_at'));
    }

    /**
     * Año de la convocatoria vigente.
     */
    public function periodYear(): int
    {
        return (int) config('admissions.period_year');
    }

    /**
     * Indica si la preinscripción está abierta.
     */
    public function isOpen(): bool
    {
        return (bool) config('admissions.force_open')
            || Date::now()->greaterThanOrEqualTo($this->opensAt());
    }

    /**
     * Indica si la inscripción formal está abierta.
     */
    public function isEnrollmentOpen(): bool
    {
        return (bool) config('admissions.force_open')
            || Date::now()->greaterThanOrEqualTo($this->enrollmentOpensAt());
    }

    /**
     * Días restantes para la apertura de la preinscripción.
     */
    public function daysUntilOpen(): int
    {
        if ($this->isOpen()) {
            return 0;
        }

        return max(0, (int) ceil(Date::now()->diffInDays($this->opensAt())));
    }
}
