<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega los datos que muestra la landing pública de carreras.
     */
    public function up(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->string('degree')->default('Licenciatura')->after('description');
            $table->string('icon', 16)->nullable()->after('degree');
            $table->string('image_path')->nullable()->after('icon');
        });

        $icons = [
            'EDPRI' => '📚',
            'EDESP' => '🤝',
            'GEHIS' => '🌎',
            'LENLI' => '📖',
        ];

        foreach ($icons as $code => $icon) {
            DB::table('careers')
                ->where('code', $code)
                ->whereNull('icon')
                ->update(['icon' => $icon]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->dropColumn(['degree', 'icon', 'image_path']);
        });
    }
};
