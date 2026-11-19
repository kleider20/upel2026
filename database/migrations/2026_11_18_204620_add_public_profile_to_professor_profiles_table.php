<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Datos que el docente publica en la landing y usa como avatar.
     */
    public function up(): void
    {
        Schema::table('professor_profiles', function (Blueprint $table) {
            $table->string('position')->nullable()->after('academic_title');
            $table->text('bio')->nullable()->after('position');
            $table->string('photo_path')->nullable()->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professor_profiles', function (Blueprint $table) {
            $table->dropColumn(['position', 'bio', 'photo_path']);
        });
    }
};
