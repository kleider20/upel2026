<?php

namespace App\Support;

use App\Models\AdmissionWindowSetting;
use App\Models\EnrollmentWindowSetting;
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
     * Configuración vigente de la ventana de preinscripción.
     */
    public function settings(): AdmissionWindowSetting
    {
        return AdmissionWindowSetting::current();
    }

    /**
     * Configuración vigente de la ventana de inscripción formal.
     */
    public function enrollmentSettings(): EnrollmentWindowSetting
    {
        return EnrollmentWindowSetting::current();
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
        return Date::parse(
            $this->enrollmentSettings()->opens_on->toDateString().' '.self::OPENING_HOUR.':00:00',
            EnrollmentWindowSetting::TIMEZONE,
        );
    }

    /**
     * Cierre de la inscripción formal: se mantiene abierta durante todo el día
     * elegido y se deshabilita automáticamente al terminar.
     */
    public function enrollmentClosesAt(): CarbonInterface
    {
        return Date::parse(
            $this->enrollmentSettings()->closes_on->toDateString().' 23:59:59',
            EnrollmentWindowSetting::TIMEZONE,
        );
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
     *
     * El modo manual tiene prioridad sobre el rango; `force_open` permite
     * habilitarla solo en desarrollo.
     */
    public function isEnrollmentOpen(): bool
    {
        if ((bool) config('admissions.force_open')) {
            return true;
        }

        $settings = $this->enrollmentSettings();

        if ($settings->mode === EnrollmentWindowSetting::MODE_OPEN) {
            return true;
        }

        if ($settings->mode === EnrollmentWindowSetting::MODE_CLOSED) {
            return false;
        }

        $now = Date::now();

        return $now->greaterThanOrEqualTo($this->enrollmentOpensAt())
            && $now->lessThanOrEqualTo($this->enrollmentClosesAt());
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
     * Motivo del cierre de la inscripción formal cuando no está abierta.
     *
     * @return array{reason: string, closes_at: string, opens_at: string}
     */
    public function enrollmentClosureContext(): array
    {
        $settings = $this->enrollmentSettings();

        if ($settings->mode === EnrollmentWindowSetting::MODE_CLOSED) {
            $reason = 'manual';
        } elseif (Date::now()->lessThan($this->enrollmentOpensAt())) {
            $reason = 'before';
        } else {
            $reason = 'after';
        }

        return [
            'reason' => $reason,
            'opens_at' => $this->enrollmentOpensAt()->toIso8601String(),
            'closes_at' => $this->enrollmentClosesAt()->toIso8601String(),
        ];
    }

    /**
     * Estado de la preinscripción para el panel de habilitación.
     *
     * @return array{opens_on: string, closes_on: string, mode: string, is_open: bool, status_label: string, status_tone: string, detail: string}
     */
    public function adminSummary(): array
    {
        $settings = $this->settings();
        $isOpen = $this->isOpen();

        $detail = match (true) {
            $settings->mode === AdmissionWindowSetting::MODE_CLOSED => 'Cerrada manualmente: el formulario de preinscripción permanece deshabilitado sin importar las fechas.',
            $settings->mode === AdmissionWindowSetting::MODE_OPEN => 'Abierta manualmente: el formulario de preinscripción permanece habilitado sin importar las fechas.',
            $isOpen => 'Se cierra automáticamente al finalizar el '.$settings->closes_on->format('d/m/Y').'.',
            Date::now()->lessThan($this->opensAt()) => 'Se abrirá automáticamente el '.$settings->opens_on->format('d/m/Y').' a las 8:00 a. m.',
            default => 'La fecha de cierre ya pasó; ajusta el rango o habilítalas manualmente.',
        };

        return [
            'opens_on' => $settings->opens_on->format('Y-m-d'),
            'closes_on' => $settings->closes_on->format('Y-m-d'),
            'mode' => $settings->mode,
            'is_open' => $isOpen,
            'status_label' => $isOpen ? 'Preinscripciones abiertas' : 'Preinscripciones cerradas',
            'status_tone' => $isOpen ? 'green' : 'red',
            'detail' => $detail,
        ];
    }

    /**
     * Estado de la inscripción formal para el panel de habilitación.
     *
     * @return array{opens_on: string, closes_on: string, mode: string, is_open: bool, status_label: string, status_tone: string, detail: string}
     */
    public function enrollmentAdminSummary(): array
    {
        $settings = $this->enrollmentSettings();
        $isOpen = $this->isEnrollmentOpen();

        $detail = match (true) {
            $settings->mode === EnrollmentWindowSetting::MODE_CLOSED => 'Cerrada manualmente: las inscripciones permanecen deshabilitadas sin importar las fechas.',
            $settings->mode === EnrollmentWindowSetting::MODE_OPEN => 'Abierta manualmente: las inscripciones permanecen habilitadas sin importar las fechas.',
            $isOpen => 'Se cierra automáticamente al finalizar el '.$settings->closes_on->format('d/m/Y').'.',
            Date::now()->lessThan($this->enrollmentOpensAt()) => 'Se abrirá automáticamente el '.$settings->opens_on->format('d/m/Y').' a las 8:00 a. m.',
            default => 'La fecha de cierre ya pasó; ajusta el rango o habilítalas manualmente.',
        };

        return [
            'opens_on' => $settings->opens_on->format('Y-m-d'),
            'closes_on' => $settings->closes_on->format('Y-m-d'),
            'mode' => $settings->mode,
            'is_open' => $isOpen,
            'status_label' => $isOpen ? 'Inscripciones abiertas' : 'Inscripciones cerradas',
            'status_tone' => $isOpen ? 'green' : 'red',
            'detail' => $detail,
        ];
    }

    /**
     * Fechas y estados de ambas ventanas que consumen las tarjetas del baner.
     *
     * @return array{opens_at: string, closes_at: string, enrollment_opens_at: string, enrollment_closes_at: string, is_open: bool, is_enrollment_open: bool, preinscripcion_mode: string, inscripcion_mode: string}
     */
    public function bannerWindow(): array
    {
        return [
            'opens_at' => $this->opensAt()->toIso8601String(),
            'closes_at' => $this->closesAt()->toIso8601String(),
            'enrollment_opens_at' => $this->enrollmentOpensAt()->toIso8601String(),
            'enrollment_closes_at' => $this->enrollmentClosesAt()->toIso8601String(),
            'is_open' => $this->isOpen(),
            'is_enrollment_open' => $this->isEnrollmentOpen(),
            'preinscripcion_mode' => $this->settings()->mode,
            'inscripcion_mode' => $this->enrollmentSettings()->mode,
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
