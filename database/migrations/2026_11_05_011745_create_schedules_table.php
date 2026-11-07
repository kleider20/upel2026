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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('period');
            $table->string('cohort', 10);
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->string('study_schedule', 20)->nullable();
            $table->timestamps();

            $table->unique(['career_id', 'period', 'cohort']);
            $table->index(['career_id', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
