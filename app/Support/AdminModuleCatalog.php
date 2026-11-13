<?php

namespace App\Support;

use App\Enums\Permission;

/**
 * Catálogo central de los módulos del portal administrativo.
 *
 * Cada módulo declara el permiso que lo protege y el icono que usa el
 * frontend. Así el menú, el panel y las rutas comparten la misma fuente.
 */
final class AdminModuleCatalog
{
    /**
     * @return array<string, array{title: string, description: string, permission: string, icon: string}>
     */
    public static function all(): array
    {
        return [
            'admissions' => [
                'title' => 'Admisiones',
                'description' => 'Revisa solicitudes de preinscripción, documentos y conversión a estudiantes.',
                'permission' => Permission::AdmissionsView->value,
                'icon' => 'inbox',
            ],
            'students' => [
                'title' => 'Estudiantes',
                'description' => 'Consulta expedientes, carrera, semestre y promedio general.',
                'permission' => Permission::StudentsView->value,
                'icon' => 'users',
            ],
            'professors' => [
                'title' => 'Profesores',
                'description' => 'Administra la plantilla docente y sus materias asignadas.',
                'permission' => Permission::ProfessorsView->value,
                'icon' => 'graduation-cap',
            ],
            'careers' => [
                'title' => 'Carreras',
                'description' => 'Gestiona la oferta académica, sus modalidades, horarios y pensum.',
                'permission' => Permission::CareersView->value,
                'icon' => 'library',
            ],
            'subjects' => [
                'title' => 'Materias',
                'description' => 'Gestiona las unidades curriculares, sus créditos y periodos.',
                'permission' => Permission::SubjectsView->value,
                'icon' => 'book-open',
            ],
            'pensums' => [
                'title' => 'Pensums',
                'description' => 'Organiza las materias de cada carrera por período académico y créditos.',
                'permission' => Permission::SubjectsView->value,
                'icon' => 'layers',
            ],
            'schedules' => [
                'title' => 'Horarios',
                'description' => 'Publica los horarios oficiales por carrera, período y cohorte.',
                'permission' => Permission::SchedulesView->value,
                'icon' => 'calendar-days',
            ],
            'grades' => [
                'title' => 'Notas',
                'description' => 'Supervisa las calificaciones registradas en toda la institución.',
                'permission' => Permission::GradesView->value,
                'icon' => 'clipboard-list',
            ],
            'finance' => [
                'title' => 'Finanzas',
                'description' => 'Controla pagos, cobranza y estado financiero de los estudiantes.',
                'permission' => Permission::FinanceView->value,
                'icon' => 'wallet',
            ],
            'programs' => [
                'title' => 'Postgrados y cursos',
                'description' => 'Gestiona especializaciones, maestrías, doctorados y talleres.',
                'permission' => Permission::ProgramsView->value,
                'icon' => 'award',
            ],
            'users' => [
                'title' => 'Usuarios',
                'description' => 'Administra las cuentas y los accesos del sistema.',
                'permission' => Permission::UsersView->value,
                'icon' => 'user-cog',
            ],
            'roles' => [
                'title' => 'Roles y permisos',
                'description' => 'Define el alcance de cada rol dentro de la plataforma.',
                'permission' => Permission::RolesManage->value,
                'icon' => 'shield-check',
            ],
        ];
    }

    /**
     * @return array{title: string, description: string, permission: string, icon: string}|null
     */
    public static function get(string $module): ?array
    {
        return self::all()[$module] ?? null;
    }
}
