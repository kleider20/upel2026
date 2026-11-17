<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cédula y cohorte propias del estudiante.
     *
     * Se guardan en el perfil para los estudiantes que no provienen de una
     * solicitud de admisión y para conservar el cohorte exacto (por ejemplo
     * 2025-II) aunque su año de ingreso sea otro.
     */
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('identity_document', 20)->nullable()->after('user_id')->index();
            $table->string('cohort', 10)->nullable()->after('admission_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropIndex(['identity_document']);
            $table->dropColumn(['identity_document', 'cohort']);
        });
    }
};
