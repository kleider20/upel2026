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
        Schema::table('schedule_subjects', function (Blueprint $table) {
            $table->json('date_times')->nullable()->after('dates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_subjects', function (Blueprint $table) {
            $table->dropColumn('date_times');
        });
    }
};
