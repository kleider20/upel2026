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
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedSmallInteger('period_year')->index();

            $table->string('first_name');
            $table->string('last_name');
            $table->char('nationality', 1)->default('V');
            $table->string('id_number', 20);
            $table->date('birth_date');
            $table->string('gender', 20)->nullable();
            $table->string('email');
            $table->string('phone', 30);
            $table->text('address')->nullable();

            $table->foreignId('career_id')->nullable()->constrained()->nullOnDelete();
            $table->string('modality', 20)->default('mixta');
            $table->string('shift', 30)->nullable();

            $table->string('high_school');
            $table->unsignedSmallInteger('high_school_year');
            $table->decimal('high_school_average', 4, 2);

            $table->string('status', 30)->default('recibida')->index();
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->foreignId('converted_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->unique(['id_number', 'period_year']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};
