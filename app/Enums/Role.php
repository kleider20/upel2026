<?php

namespace App\Enums;

enum Role: string
{
    case Estudiante = 'estudiante';
    case Profesor = 'profesor';
    case Graduado = 'graduado';
    case Admin = 'admin';
    case Decano = 'decano';
    case CoordinadorAcademico = 'coordinador_academico';
    case PersonalAdministrativo = 'personal_administrativo';

    /**
     * Etiqueta legible para la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::Estudiante => 'Estudiante',
            self::Profesor => 'Profesor',
            self::Graduado => 'Graduado',
            self::Admin => 'Administrador del sistema',
            self::Decano => 'Decano',
            self::CoordinadorAcademico => 'Coordinador académico',
            self::PersonalAdministrativo => 'Personal administrativo',
        };
    }

    /**
     * Descripción del alcance del rol administrativo.
     */
    public function description(): string
    {
        return match ($this) {
            self::Admin => 'Control total del sistema, usuarios, roles y configuración institucional.',
            self::Decano => 'Supervisión académica y financiera de la institución.',
            self::CoordinadorAcademico => 'Gestión de carreras, materias, profesores, estudiantes y notas.',
            self::PersonalAdministrativo => 'Gestión de finanzas, pagos y cobranza estudiantil.',
            default => 'Acceso al campus virtual de la UPEL.',
        };
    }

    /**
     * Indica si el rol pertenece al portal administrativo.
     */
    public function isAdminPortal(): bool
    {
        return in_array($this, self::adminPortalCases(), true);
    }

    /**
     * Roles que pueden autenticarse en el portal administrativo.
     *
     * @return array<int, self>
     */
    public static function adminPortalCases(): array
    {
        return [
            self::Admin,
            self::Decano,
            self::CoordinadorAcademico,
            self::PersonalAdministrativo,
        ];
    }

    /**
     * Roles del portal administrativo como cadenas para Spatie.
     *
     * @return array<int, string>
     */
    public static function adminPortalValues(): array
    {
        return array_map(
            static fn (self $role): string => $role->value,
            self::adminPortalCases(),
        );
    }

    /**
     * Roles disponibles en el modal de acceso de la landing.
     *
     * @return array<int, self>
     */
    public static function portalCases(): array
    {
        return [
            self::Estudiante,
            self::Profesor,
            self::Graduado,
        ];
    }

    /**
     * Roles del portal público como cadenas para Spatie.
     *
     * @return array<int, string>
     */
    public static function portalValues(): array
    {
        return array_map(
            static fn (self $role): string => $role->value,
            self::portalCases(),
        );
    }
}
