<?php

use App\Models\Career;
use App\Models\Subject;
use App\Support\ElectiveSlotCatalog;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Carga los bloques de libre elección que faltaban en los pensums ya
     * registrados. En una instalación nueva las carreras todavía no existen y
     * el seeder se encarga de crearlos.
     */
    public function up(): void
    {
        Career::query()
            ->whereIn('code', ['EDPRI'])
            ->get()
            ->each(function (Career $career): void {
                foreach (ElectiveSlotCatalog::forCareer($career->code) as $slot) {
                    Subject::query()->updateOrCreate(
                        [
                            'career_id' => $career->id,
                            'code' => $slot['code'],
                        ],
                        ElectiveSlotCatalog::attributes($slot),
                    );
                }
            });
    }

    /**
     * Elimina los bloques de libre elección cargados por la migración.
     */
    public function down(): void
    {
        $codes = collect(ElectiveSlotCatalog::forCareer('EDPRI'))
            ->pluck('code')
            ->all();

        Subject::query()
            ->where('is_elective_slot', true)
            ->whereIn('code', $codes)
            ->delete();
    }
};
