<?php

use App\Http\Controllers\AdminAdmissionController;
use App\Http\Controllers\AdminCareerController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminEntryController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\AdminModuleController;
use App\Http\Controllers\AdminSubjectController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\AdmissionLookupController;
use App\Http\Controllers\Auth\PasswordDefinitionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\NewsletterSubscriptionController;
use App\Http\Controllers\ProfessorGradeController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\TramiteController as StudentTramiteController;
use App\Http\Middleware\EnsureAdminPortal;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing');

Route::post('newsletter', [NewsletterSubscriptionController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('newsletter.store');

Route::prefix('preinscripcion')
    ->name('admissions.')
    ->group(function () {
        Route::get('/', [AdmissionController::class, 'create'])->name('create');
        Route::post('/', [AdmissionController::class, 'store'])
            ->middleware('throttle:10,1')
            ->name('store');
        Route::get('estado', [AdmissionLookupController::class, 'index'])->name('lookup');
        Route::post('estado', [AdmissionLookupController::class, 'lookup'])
            ->middleware('throttle:8,1')
            ->name('lookup.submit');

        Route::middleware('signed')->group(function () {
            Route::get('solicitud/{admission:code}', [AdmissionController::class, 'show'])
                ->name('show');
            Route::post('solicitud/{admission:code}/documentos', [AdmissionController::class, 'storeDocument'])
                ->middleware('throttle:12,1')
                ->name('documents.store');
            Route::delete('solicitud/{admission:code}/documentos/{document}', [AdmissionController::class, 'destroyDocument'])
                ->name('documents.destroy');
        });
    });

Route::middleware('auth')->group(function () {
    Route::get('definir-contrasena', [PasswordDefinitionController::class, 'edit'])
        ->name('password.define');
    Route::put('definir-contrasena', [PasswordDefinitionController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.define.update');
});

Route::get('admin', AdminEntryController::class)->name('admin.entry');
Route::get('admin/login', [AdminLoginController::class, 'show'])->name('admin.login');

Route::middleware(['auth', EnsureAdminPortal::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::get('admissions', [AdminAdmissionController::class, 'index'])
            ->name('admissions.index');
        Route::get('admissions/{admission:code}', [AdminAdmissionController::class, 'show'])
            ->name('admissions.show');
        Route::patch('admissions/{admission:code}/status', [AdminAdmissionController::class, 'updateStatus'])
            ->name('admissions.status');
        Route::post('admissions/{admission:code}/convert', [AdminAdmissionController::class, 'convert'])
            ->name('admissions.convert');
        Route::get('admissions/{admission:code}/documents/{document}', [AdminAdmissionController::class, 'downloadDocument'])
            ->name('admissions.documents.download');
        Route::get('admissions/{admission:code}/documents/{document}/ver', [AdminAdmissionController::class, 'previewDocument'])
            ->name('admissions.documents.preview');
        Route::patch('admissions/{admission:code}/documents/{document}', [AdminAdmissionController::class, 'reviewDocument'])
            ->name('admissions.documents.review');

        Route::get('subjects', [AdminSubjectController::class, 'index'])
            ->name('subjects.index');
        Route::get('subjects/create', [AdminSubjectController::class, 'create'])
            ->name('subjects.create');
        Route::post('subjects', [AdminSubjectController::class, 'store'])
            ->name('subjects.store');
        Route::get('subjects/{subject}/edit', [AdminSubjectController::class, 'edit'])
            ->name('subjects.edit');
        Route::put('subjects/{subject}', [AdminSubjectController::class, 'update'])
            ->name('subjects.update');
        Route::delete('subjects/{subject}', [AdminSubjectController::class, 'destroy'])
            ->name('subjects.destroy');

        Route::get('careers', [AdminCareerController::class, 'index'])
            ->name('careers.index');
        Route::get('careers/create', [AdminCareerController::class, 'create'])
            ->name('careers.create');
        Route::post('careers', [AdminCareerController::class, 'store'])
            ->name('careers.store');
        Route::get('careers/{career}/edit', [AdminCareerController::class, 'edit'])
            ->name('careers.edit');
        Route::put('careers/{career}', [AdminCareerController::class, 'update'])
            ->name('careers.update');
        Route::delete('careers/{career}', [AdminCareerController::class, 'destroy'])
            ->name('careers.destroy');

        Route::get('{module}', [AdminModuleController::class, 'index'])->name('module');
    });

Route::middleware(['auth', 'verified', 'password.defined'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::put('dashboard/notas/{enrollment}', [ProfessorGradeController::class, 'update'])
        ->middleware('role:profesor')
        ->name('professor.grades.update');
});

Route::middleware(['auth', 'verified', 'role:estudiante', 'password.defined'])
    ->prefix('estudiante')
    ->name('student.')
    ->group(function () {
        Route::get('/dashboard', [StudentDashboardController::class, 'index'])->name('dashboard');
        Route::put('/perfil', [StudentDashboardController::class, 'updateProfile'])->name('profile.update');
        Route::post('/tramites', [StudentTramiteController::class, 'store'])->name('tramites.store');
    });

require __DIR__.'/settings.php';
