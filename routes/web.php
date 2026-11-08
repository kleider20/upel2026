<?php

use App\Http\Controllers\AdminAdmissionController;
use App\Http\Controllers\AdminCareerController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminEntryController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\AdminModuleController;
use App\Http\Controllers\AdminProfessorController;
use App\Http\Controllers\AdminRoleController;
use App\Http\Controllers\AdminScheduleController;
use App\Http\Controllers\AdminStudentProfileController;
use App\Http\Controllers\AdminSubjectController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\AdmissionLookupController;
use App\Http\Controllers\Auth\PasswordDefinitionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\NewsletterSubscriptionController;
use App\Http\Controllers\ProfessorGradeController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\StudentNotificationController;
use App\Http\Controllers\Student\StudentScheduleController;
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
        Route::post('validar-identidad', [AdmissionController::class, 'checkIdentity'])
            ->middleware('throttle:20,1')
            ->name('identity');
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
        Route::get('admissions/{admission:code}/edit', [AdminAdmissionController::class, 'edit'])
            ->name('admissions.edit');
        Route::put('admissions/{admission:code}', [AdminAdmissionController::class, 'update'])
            ->name('admissions.update');
        Route::delete('admissions/{admission:code}', [AdminAdmissionController::class, 'destroy'])
            ->name('admissions.destroy');
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

        Route::get('students/{student:student_code}/edit', [AdminStudentProfileController::class, 'edit'])
            ->name('students.edit');
        Route::put('students/{student:student_code}', [AdminStudentProfileController::class, 'update'])
            ->name('students.update');
        Route::delete('students/{student:student_code}', [AdminStudentProfileController::class, 'destroy'])
            ->name('students.destroy');
        Route::get('students/{student:student_code}', [AdminStudentProfileController::class, 'show'])
            ->name('students.show');

        Route::get('professors', [AdminProfessorController::class, 'index'])
            ->name('professors.index');
        Route::get('professors/create', [AdminProfessorController::class, 'create'])
            ->name('professors.create');
        Route::post('professors', [AdminProfessorController::class, 'store'])
            ->name('professors.store');
        Route::get('professors/{professor}/edit', [AdminProfessorController::class, 'edit'])
            ->name('professors.edit');
        Route::put('professors/{professor}', [AdminProfessorController::class, 'update'])
            ->name('professors.update');
        Route::delete('professors/{professor}', [AdminProfessorController::class, 'destroy'])
            ->name('professors.destroy');
        Route::get('professors/{professor}', [AdminProfessorController::class, 'show'])
            ->name('professors.show');

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

        Route::get('schedules', [AdminScheduleController::class, 'index'])
            ->name('schedules.index');
        Route::get('schedules/create', [AdminScheduleController::class, 'create'])
            ->name('schedules.create');
        Route::post('schedules', [AdminScheduleController::class, 'store'])
            ->name('schedules.store');
        Route::get('schedules/{schedule}/edit', [AdminScheduleController::class, 'edit'])
            ->name('schedules.edit');
        Route::put('schedules/{schedule}', [AdminScheduleController::class, 'update'])
            ->name('schedules.update');
        Route::get('schedules/{schedule}', [AdminScheduleController::class, 'show'])
            ->name('schedules.show');
        Route::get('schedules/{schedule}/pdf', [AdminScheduleController::class, 'pdf'])
            ->name('schedules.pdf');
        Route::delete('schedules/{schedule}', [AdminScheduleController::class, 'destroy'])
            ->name('schedules.destroy');

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

        Route::get('roles', [AdminRoleController::class, 'index'])
            ->name('roles.index');
        Route::post('roles', [AdminRoleController::class, 'store'])
            ->name('roles.store');
        Route::put('roles/{role}', [AdminRoleController::class, 'update'])
            ->name('roles.update');
        Route::delete('roles/{role}', [AdminRoleController::class, 'destroy'])
            ->name('roles.destroy');
        Route::post('permissions', [AdminRoleController::class, 'storePermission'])
            ->name('permissions.store');
        Route::put('permissions/{permission}', [AdminRoleController::class, 'updatePermission'])
            ->name('permissions.update');
        Route::delete('permissions/{permission}', [AdminRoleController::class, 'destroyPermission'])
            ->name('permissions.destroy');
        Route::put('users/{user}/access', [AdminRoleController::class, 'updateUser'])
            ->name('roles.users.update');

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
        Route::patch('/notificaciones/{notification}/leer', StudentNotificationController::class)
            ->name('notifications.read');
        Route::get('/horario/pdf', [StudentScheduleController::class, 'download'])->name('schedule.pdf');
        Route::put('/perfil', [StudentDashboardController::class, 'updateProfile'])->name('profile.update');
        Route::post('/tramites', [StudentTramiteController::class, 'store'])->name('tramites.store');
    });

require __DIR__.'/settings.php';
