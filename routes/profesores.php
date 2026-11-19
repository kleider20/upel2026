<?php

use App\Http\Controllers\EvaluationPlanItemController;
use App\Http\Controllers\EvaluationPlanScoreController;
use App\Http\Controllers\ProfessorEvaluationPlanController;
use App\Http\Controllers\ProfessorGradeController;
use App\Http\Controllers\ProfessorProfileController;
use App\Http\Controllers\ProfessorWorkspaceController;
use Illuminate\Support\Facades\Route;

/*
 * Rutas del portal docente, montadas bajo /dashboard por web.php.
 * El resumen del docente se muestra en /dashboard (ruta "dashboard").
 */
Route::middleware('role:profesor')
    ->prefix('profesor')
    ->name('professor.')
    ->group(function () {
        Route::get('estudiantes', [ProfessorWorkspaceController::class, 'students'])->name('students');
        Route::get('cargar-notas', [ProfessorWorkspaceController::class, 'grades'])->name('grades.index');
        Route::put('notas/{enrollment}', [ProfessorGradeController::class, 'update'])->name('grades.update');
        Route::get('mis-carreras', [ProfessorWorkspaceController::class, 'careers'])->name('careers');
        Route::get('horario', [ProfessorWorkspaceController::class, 'schedule'])->name('schedule');
        Route::get('horario/ics', [ProfessorWorkspaceController::class, 'scheduleIcs'])->name('schedule.ics');
        Route::get('perfil', [ProfessorProfileController::class, 'edit'])->name('profile.edit');
        Route::put('perfil', [ProfessorProfileController::class, 'update'])->name('profile.update');

        Route::prefix('planes-evaluacion')
            ->name('plans.')
            ->group(function () {
                Route::get('/', [ProfessorEvaluationPlanController::class, 'index'])->name('index');
                Route::get('crear', [ProfessorEvaluationPlanController::class, 'create'])->name('create');
                Route::post('/', [ProfessorEvaluationPlanController::class, 'store'])->name('store');
                Route::delete('{plan}', [ProfessorEvaluationPlanController::class, 'destroy'])->name('destroy');
                Route::post('{plan}/evaluaciones', [EvaluationPlanItemController::class, 'store'])->name('items.store');
                Route::put('{plan}/evaluaciones/{item}', [EvaluationPlanItemController::class, 'update'])->name('items.update');
                Route::delete('{plan}/evaluaciones/{item}', [EvaluationPlanItemController::class, 'destroy'])->name('items.destroy');
                Route::put('{plan}/notas', [EvaluationPlanScoreController::class, 'update'])->name('scores.update');
                Route::get('{plan}', [ProfessorEvaluationPlanController::class, 'show'])->name('show');
            });
    });
