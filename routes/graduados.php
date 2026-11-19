<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
 * Rutas del portal de graduados, montadas bajo /dashboard por web.php.
 * El resumen del graduado se muestra en /dashboard (ruta "dashboard").
 */
Route::middleware('role:graduado')
    ->prefix('graduado')
    ->name('graduate.')
    ->group(function () {
        Route::get('record', [DashboardController::class, 'graduateRecord'])->name('record');
        Route::get('programas', [DashboardController::class, 'graduatePrograms'])->name('programs');
    });
