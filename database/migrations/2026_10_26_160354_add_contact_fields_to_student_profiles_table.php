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
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('status');
            $table->string('personal_email')->nullable()->after('phone');
            $table->string('address', 500)->nullable()->after('personal_email');
            $table->date('birth_date')->nullable()->after('address');
            $table->string('birth_place')->nullable()->after('birth_date');
            $table->string('emergency_contact')->nullable()->after('birth_place');
            $table->string('shift', 30)->nullable()->after('emergency_contact');
            $table->string('advisor')->nullable()->after('shift');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'personal_email',
                'address',
                'birth_date',
                'birth_place',
                'emergency_contact',
                'shift',
                'advisor',
            ]);
        });
    }
};
