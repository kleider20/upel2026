<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ventana de inscripción formal, independiente de la preinscripción.
     */
    public function up(): void
    {
        Schema::create('enrollment_window_settings', function (Blueprint $table): void {
            $table->id();
            $table->date('opens_on');
            $table->date('closes_on');
            $table->string('mode')->default('automatic');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_window_settings');
    }
};
