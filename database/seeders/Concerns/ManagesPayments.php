<?php

namespace Database\Seeders\Concerns;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Registra los pagos de un estudiante a partir de una lista de conceptos.
 */
trait ManagesPayments
{
    /**
     * Crea o actualiza los pagos indicados del estudiante.
     *
     * @param  array<int, array{0: string, 1: float, 2: string, 3: string, 4: string|null}>  $payments
     */
    protected function createPayments(User $student, array $payments): void
    {
        foreach ($payments as [$concept, $amount, $status, $dueDate, $paidAt]) {
            Payment::query()->updateOrCreate(
                [
                    'student_id' => $student->id,
                    'concept' => $concept,
                    'due_date' => Carbon::parse($dueDate),
                ],
                [
                    'amount' => $amount,
                    'status' => $status,
                    'paid_at' => $paidAt !== null ? Carbon::parse($paidAt) : null,
                ],
            );
        }
    }

    /**
     * Pagos de demostración del período 2026-II.
     */
    protected function seedDemoPayments(User $student): void
    {
        $this->createPayments($student, [
            ['Inscripción semestral 2026-II', 25.00, 'pagado', '2026-09-10', '2026-09-08'],
            ['Mensualidad septiembre 2026', 45.00, 'pagado', '2026-09-30', '2026-09-28'],
            ['Mensualidad octubre 2026', 45.00, 'pendiente', '2026-10-31', null],
            ['Mensualidad noviembre 2026', 45.00, 'pendiente', '2026-11-30', null],
        ]);
    }
}
