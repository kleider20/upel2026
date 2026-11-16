<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marca los bloques de libre elección del pensum base.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->boolean('is_elective_slot')->default(false);
        });
    }

    /**
     * Revierte la marca de los bloques de libre elección.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropColumn('is_elective_slot');
        });
    }
};
