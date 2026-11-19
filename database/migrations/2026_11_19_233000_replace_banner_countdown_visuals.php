<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unifica las dos cuentas regresivas en una sola con fecha configurable.
     */
    public function up(): void
    {
        Schema::table('banner_slides', function (Blueprint $table): void {
            $table->string('countdown_at')->nullable()->after('image_path');
            $table->string('countdown_label')->nullable()->after('countdown_at');
        });

        DB::table('banner_slides')
            ->where('visual', 'preinscripcion')
            ->update([
                'visual' => 'countdown',
                'countdown_at' => Date::parse((string) config('admissions.opens_at'))->toIso8601String(),
                'countdown_label' => 'Apertura de preinscripciones',
            ]);

        DB::table('banner_slides')
            ->where('visual', 'inscripciones')
            ->update([
                'visual' => 'countdown',
                'countdown_at' => Date::parse((string) config('admissions.enrollment_opens_at'))->toIso8601String(),
                'countdown_label' => 'Apertura de inscripciones',
            ]);
    }

    public function down(): void
    {
        DB::table('banner_slides')
            ->where('visual', 'countdown')
            ->update(['visual' => 'preinscripcion']);

        Schema::table('banner_slides', function (Blueprint $table): void {
            $table->dropColumn(['countdown_at', 'countdown_label']);
        });
    }
};
