<?php

use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\StudentDocumentController;
use App\Http\Controllers\Student\StudentEnrollmentController;
use App\Http\Controllers\Student\StudentNotificationController;
use App\Http\Controllers\Student\StudentPhotoController;
use App\Http\Controllers\Student\StudentProfessorController;
use App\Http\Controllers\Student\StudentScheduleController;
use App\Http\Controllers\Student\TramiteController as StudentTramiteController;
use Illuminate\Support\Facades\Route;

/*
 * Rutas del portal estudiantil, montadas bajo /dashboard por web.php.
 * La página de inicio del estudiante es /dashboard (ruta "dashboard").
 */
Route::middleware('role:estudiante')
    ->prefix('estudiante')
    ->name('student.')
    ->group(function () {
        Route::get('solicitud', [StudentDashboardController::class, 'solicitud'])->name('solicitud');
        Route::get('materias', [StudentDashboardController::class, 'materias'])->name('materias');
        Route::get('inscripciones', [StudentEnrollmentController::class, 'index'])->name('enrollment.index');
        Route::post('inscripciones', [StudentEnrollmentController::class, 'store'])->name('enrollment.store');
        Route::get('inscripciones/planilla', [StudentEnrollmentController::class, 'sheet'])->name('enrollment.sheet');
        Route::get('calificaciones', [StudentDashboardController::class, 'calificaciones'])->name('calificaciones');
        Route::get('profesores', [StudentDashboardController::class, 'profesores'])->name('profesores');
        Route::get('pensum', [StudentDashboardController::class, 'pensum'])->name('pensum');
        Route::get('horario', [StudentDashboardController::class, 'horario'])->name('horario');
        Route::get('perfil', [StudentDashboardController::class, 'perfil'])->name('perfil');
        Route::get('tramites', [StudentDashboardController::class, 'tramites'])->name('tramites');
        Route::patch('notificaciones/{notification}/leer', StudentNotificationController::class)
            ->name('notifications.read');
        Route::get('horario/pdf', [StudentScheduleController::class, 'download'])->name('schedule.pdf');
        Route::get('profesores/{professor}', [StudentProfessorController::class, 'show'])->name('professors.show');
        Route::get('foto', StudentPhotoController::class)->name('photo');
        Route::post('documentos', [StudentDocumentController::class, 'store'])->name('documents.store');
        Route::get('documentos/{document}', [StudentDocumentController::class, 'preview'])->name('documents.preview');
        Route::get('documentos/{document}/descargar', [StudentDocumentController::class, 'download'])->name('documents.download');
        Route::put('perfil', [StudentDashboardController::class, 'updateProfile'])->name('profile.update');
        Route::post('tramites', [StudentTramiteController::class, 'store'])->name('tramites.store');
    });
