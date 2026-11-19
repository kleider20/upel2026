<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    use SyncsRolePermissions;

    /**
     * Correo institucional del administrador del sistema.
     */
    public const ADMIN_EMAIL = 'admin@upel.edu.ve';

    /**
     * Contraseña inicial del administrador.
     */
    public const ADMIN_PASSWORD = 'Admin12345!';

    /**
     * Nombre completo del administrador.
     */
    public const ADMIN_NAME = 'Administrador del Sistema';

    /**
     * Crea el usuario administrador del sistema.
     */
    public function run(): void
    {
        $this->createUserWithRole(
            self::ADMIN_NAME,
            self::ADMIN_EMAIL,
            self::ADMIN_PASSWORD,
            RoleEnum::Admin,
        );
    }
}
