<?php

namespace Database\Seeders;

use App\Models\Classroom;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    /**
     * Aulas base del núcleo para probar la asignación desde los horarios.
     */
    public function run(): void
    {
        foreach ([
            ['code' => 'A-101', 'name' => 'Sala de clases 1', 'capacity' => 35],
            ['code' => 'A-102', 'name' => 'Sala de clases 2', 'capacity' => 35],
            ['code' => 'LAB-01', 'name' => 'Laboratorio de cómputo', 'capacity' => 30],
            ['code' => 'AUD-01', 'name' => 'Auditorio', 'capacity' => 120],
        ] as $classroom) {
            Classroom::query()->firstOrCreate(
                ['code' => $classroom['code']],
                $classroom,
            );
        }
    }
}
