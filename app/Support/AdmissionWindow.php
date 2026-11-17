<?php

namespace App\Support;

use App\Models\AdmissionWindowSetting;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Date;

/**
 * Reglas de la ventana oficial de preinscripción e inscripción.
 *
 * El rango de fechas y el estado manual los administra el panel
 * administrativo (administrador y decano); la landing, el formulario público
 * y las pruebas comparten exactamente el mismo cálculo.
 */
final class AdmissionWindow
{
    /**
     * Hora oficial de apertura de cada jornada.
     */
    private const OPENING_HOUR = 8;

    /**
     * Configuración vigente de la ventana.
     */
    public function settings(): AdmissionWindowSetting
    {
        return AdmissionWindowSetting::current();
    }

    /**
     * Inicio de la preinscripción.
     */
    public function opensAt(): CarbonInterface
    {
        return Date::parse(
            $this->settings()->opens_on->toDateString().' '.self::OPENING_HOUR.':00:00',
            AdmissionWindowSetting::TIMEZONE,
        );
    }

    /**
     * Cierre de la preinscripción: se mantiene abierta durante todo el día
     * elegido y se deshabilita automáticamente al terminar.
     */
    public function closesAt(): CarbonInterface
    {
        return Date::parse(
            $this->settings()->closes_on->toDateString().' 23:59:59',
            AdmissionWindowSetting::TIMEZONE,
        );
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
     *
     * El modo manual tiene prioridad; en modo automático la ventana solo está
     * abierta dentro del rango de fechas configurado.
     */
    public function isOpen(): bool
    {
        $settings = $this->settings();

        if ($settings->mode === AdmissionWindowSetting::MODE_OPEN) {
            return true;
        }

        if ($settings->mode === AdmissionWindowSetting::MODE_CLOSED) {
            return false;
        }

        $now = Date::now();

        return $now->greaterThanOrEqualTo($this->opensAt())
            && $now->lessThanOrEqualTo($this->closesAt());
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
     * Motivo del cierre cuando la ventana no está abierta.
     *
     * @return array{reason: string, closes_at: string, opens_at: string}
     */
    public function closureContext(): array
    {
        $settings = $this->settings();

        if ($settings->mode === AdmissionWindowSetting::MODE_CLOSED) {
            $reason = 'manual';
        } elseif (Date::now()->lessThan($this->opensAt())) {
            $reason = 'before';
        } else {
            $reason = 'after';
        }

        return [
            'reason' => $reason,
            'opens_at' => $this->opensAt()->toIso8601String(),
            'closes_at' => $this->closesAt()->toIso8601String(),
        ];
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
