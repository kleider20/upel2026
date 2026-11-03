<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('career_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained()->cascadeOnDelete();
            $table->string('modality')->default('presencial');
            $table->string('schedule')->default('lunes_viernes');
            $table->string('shift')->default('diurno');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['career_id', 'modality', 'schedule', 'shift']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_offerings');
    }
};
