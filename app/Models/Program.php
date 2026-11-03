<?php

namespace App\Models;

use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $type
 * @property string|null $description
 * @property string|null $duration
 * @property string $modality
 * @property bool $is_active
 */
#[Fillable(['name', 'type', 'description', 'duration', 'modality', 'is_active'])]
class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Etiqueta del tipo de programa.
     */
    public function typeLabel(): string
    {
        return self::typeLabels()[$this->type] ?? 'Programa';
    }

    /**
     * @return array<string, string>
     */
    public static function typeLabels(): array
    {
        return [
            'especializacion' => 'Especialización',
            'maestria' => 'Maestría',
            'doctorado' => 'Doctorado',
            'curso' => 'Curso',
            'taller' => 'Taller',
        ];
    }

    /**
     * Etiqueta de la modalidad.
     */
    public function modalityLabel(): string
    {
        return match ($this->modality) {
            'presencial' => 'Presencial',
            'mixta' => 'Semipresencial',
            default => 'Online',
        };
    }
}
