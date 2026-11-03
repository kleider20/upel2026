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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->unsignedTinyInteger('semester')->default(1);
            $table->string('component')->nullable();
            $table->string('type')->nullable();
            $table->string('area')->nullable();
            $table->string('level')->nullable();
            $table->unsignedTinyInteger('credits')->default(4);
            $table->unsignedTinyInteger('theory_hours')->default(4);
            $table->unsignedTinyInteger('practice_hours')->default(0);
            $table->string('prerequisites')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['career_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
