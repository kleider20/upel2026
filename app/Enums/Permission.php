<?php

namespace App\Enums;

enum Permission: string
{
    case StudentPortal = 'portal.estudiante';
    case ProfessorPortal = 'portal.profesor';
    case GraduatePortal = 'portal.graduado';

    case DashboardView = 'dashboard.view';

    case StudentsView = 'students.view';
    case StudentsViewPrivate = 'students.private.view';
    case StudentsManage = 'students.manage';

    case ProfessorsView = 'professors.view';
    case ProfessorsManage = 'professors.manage';
    case ProfessorsDelete = 'professors.delete';

    case CareersView = 'careers.view';
    case CareersManage = 'careers.manage';

    case SubjectsView = 'subjects.view';
    case SubjectsManage = 'subjects.manage';

    case SchedulesView = 'schedules.view';
    case SchedulesManage = 'schedules.manage';

    case GradesView = 'grades.view';
    case GradesManage = 'grades.manage';

    case AdmissionsView = 'admissions.view';
    case AdmissionsManage = 'admissions.manage';
    case AdmissionsEdit = 'admissions.edit';
    case AdmissionsDelete = 'admissions.delete';
    case AdmissionsReview = 'admissions.review';

    case FinanceView = 'finance.view';
    case FinanceManage = 'finance.manage';

    case ProgramsView = 'programs.view';
    case ProgramsManage = 'programs.manage';

    case UsersView = 'users.view';
    case UsersManage = 'users.manage';

    case RolesManage = 'roles.manage';
    case SettingsManage = 'settings.manage';

    /**
     * Etiqueta legible para la interfaz administrativa.
     */
    public function label(): string
    {
        return match ($this) {
            self::StudentPortal => 'Acceso al portal de estudiantes',
            self::ProfessorPortal => 'Acceso al portal de profesores',
            self::GraduatePortal => 'Acceso al portal de graduados',
            self::DashboardView => 'Ver panel administrativo',
            self::StudentsView => 'Ver estudiantes',
            self::StudentsViewPrivate => 'Ver información privada de estudiantes',
            self::StudentsManage => 'Gestionar estudiantes',
            self::ProfessorsView => 'Ver profesores',
            self::ProfessorsManage => 'Gestionar profesores',
            self::ProfessorsDelete => 'Eliminar profesores',
            self::CareersView => 'Ver carreras',
            self::CareersManage => 'Gestionar carreras',
            self::SubjectsView => 'Ver materias',
            self::SubjectsManage => 'Gestionar materias',
            self::SchedulesView => 'Ver horarios',
            self::SchedulesManage => 'Gestionar horarios',
            self::GradesView => 'Ver notas',
            self::GradesManage => 'Gestionar notas',
            self::AdmissionsView => 'Ver admisiones',
            self::AdmissionsManage => 'Gestionar admisiones',
            self::AdmissionsEdit => 'Editar solicitudes de admisión',
            self::AdmissionsDelete => 'Eliminar solicitudes de admisión',
            self::AdmissionsReview => 'Revisar solicitudes de admisión',
            self::FinanceView => 'Ver finanzas',
            self::FinanceManage => 'Gestionar finanzas',
            self::ProgramsView => 'Ver postgrados y cursos',
            self::ProgramsManage => 'Gestionar postgrados y cursos',
            self::UsersView => 'Ver usuarios',
            self::UsersManage => 'Gestionar usuarios',
            self::RolesManage => 'Gestionar roles y permisos',
            self::SettingsManage => 'Gestionar configuración',
        };
    }

    /**
     * Permisos académicos compartidos por decano y coordinador.
     *
     * @return array<int, self>
     */
    public static function academic(): array
    {
        return [
            self::DashboardView,
            self::ProfessorsView,
            self::ProfessorsManage,
            self::CareersView,
            self::CareersManage,
            self::SubjectsView,
            self::SubjectsManage,
            self::SchedulesView,
            self::SchedulesManage,
            self::GradesView,
            self::GradesManage,
            self::ProgramsView,
            self::ProgramsManage,
        ];
    }

    /**
     * Permisos financieros.
     *
     * @return array<int, self>
     */
    public static function finance(): array
    {
        return [
            self::DashboardView,
            self::FinanceView,
            self::FinanceManage,
        ];
    }

    /**
     * Permisos exclusivos del administrador del sistema.
     *
     * @return array<int, self>
     */
    public static function system(): array
    {
        return [
            self::UsersView,
            self::UsersManage,
            self::RolesManage,
            self::SettingsManage,
        ];
    }

    /**
     * Todos los permisos como cadenas para Spatie.
     *
     * @param  array<int, self>  $permissions
     * @return array<int, string>
     */
    public static function values(array $permissions): array
    {
        return array_map(
            static fn (self $permission): string => $permission->value,
            $permissions,
        );
    }
}
