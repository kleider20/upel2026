<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aula asignada a cada materia del horario.
     */
    public function up(): void
    {
        Schema::table('schedule_subjects', function (Blueprint $table) {
            $table->foreignId('classroom_id')
                ->nullable()
                ->after('professor_id')
                ->constrained('classrooms')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('classroom_id');
        });
    }
};
