<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property string $concept
 * @property float $amount
 * @property string $status
 * @property Carbon $due_date
 * @property Carbon|null $paid_at
 */
#[Fillable(['student_id', 'concept', 'amount', 'status', 'due_date', 'paid_at'])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'due_date' => 'date',
            'paid_at' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Etiqueta del estado del pago.
     */
    public function statusLabel(): string
    {
        return match ($this->status) {
            'pagado' => 'Pagado',
            'vencido' => 'Vencido',
            default => 'Pendiente',
        };
    }

    /**
     * Tono visual del estado del pago.
     */
    public function statusTone(): string
    {
        return match ($this->status) {
            'pagado' => 'green',
            'vencido' => 'red',
            default => 'amber',
        };
    }
}
