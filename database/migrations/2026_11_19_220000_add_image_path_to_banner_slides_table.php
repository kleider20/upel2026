<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega la imagen del baner y sustituye las tarjetas decorativas fijas.
     */
    public function up(): void
    {
        Schema::table('banner_slides', function (Blueprint $table): void {
            $table->string('image_path')->nullable()->after('visual');
        });

        DB::table('banner_slides')
            ->whereIn('visual', ['institucional', 'noticia', 'congreso', 'portal'])
            ->update(['visual' => 'imagen']);
    }

    public function down(): void
    {
        DB::table('banner_slides')
            ->where('visual', 'imagen')
            ->update(['visual' => 'institucional']);

        Schema::table('banner_slides', function (Blueprint $table): void {
            $table->dropColumn('image_path');
        });
    }
};
