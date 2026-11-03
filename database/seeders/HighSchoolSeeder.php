<?php

namespace Database\Seeders;

use App\Models\HighSchool;
use Illuminate\Database\Seeder;

class HighSchoolSeeder extends Seeder
{
    /**
     * Carga los planteles de bachillerato conocidos.
     *
     * Los aspirantes pueden elegir uno de la lista o escribir un plantel
     * distinto; al enviar el formulario, los nuevos se agregan a esta tabla.
     */
    public function run(): void
    {
        foreach ($this->highSchools() as $name) {
            HighSchool::query()->firstOrCreate(['name' => $name]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function highSchools(): array
    {
        return [
            'Liceo Andrés Bello',
            'Liceo Fermín Toro',
            'Unidad Educativa Colegio La Salle',
            'Liceo José María Vargas',
            'Unidad Educativa Nacional Pedro Gual',
            'Liceo Aplicación',
            'Unidad Educativa Instituto Nacional de Cooperación Educativa',
            'Liceo Bolivariano Simón Bolívar',
            'Colegio San Ignacio de Loyola',
            'Liceo Francisco de Miranda',
            'Unidad Educativa Colegio Santiago de León de Caracas',
            'Liceo Rafael Urdaneta',
            'Colegio Nuestra Señora del Rosario',
            'Liceo Caracas',
            'Unidad Educativa Colegio Los Arces',
        ];
    }
}
