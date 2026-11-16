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
        Schema::create('evaluation_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->default(1);
            $table->string('title', 120);
            $table->text('content')->nullable();
            $table->unsignedTinyInteger('weight')->default(1);
            $table->date('scheduled_on');
            $table->timestamps();

            $table->unique(['evaluation_plan_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_plan_items');
    }
};
