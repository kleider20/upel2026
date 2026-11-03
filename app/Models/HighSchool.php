<?php

namespace App\Models;

use Database\Factories\HighSchoolFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Plantel de bachillerato de procedencia del aspirante.
 *
 * @property int $id
 * @property string $name
 */
#[Fillable(['name'])]
class HighSchool extends Model
{
    /** @use HasFactory<HighSchoolFactory> */
    use HasFactory;
}
