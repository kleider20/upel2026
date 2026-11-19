<?php

namespace Database\Seeders\Users\Professors;

use App\Enums\Role as RoleEnum;
use Database\Seeders\Concerns\ManagesProfessorProfiles;
use Database\Seeders\Concerns\SyncsRolePermissions;
use Illuminate\Database\Seeder;

/**
 * Base declarativa para docentes con cargos administrativos.
 */
abstract class BaseProfessorAdministrativeSeeder extends Seeder
{
    use ManagesProfessorProfiles, SyncsRolePermissions;

    /**
     * Nombre completo del docente.
     */
    abstract protected function name(): string;

    /**
     * Correo institucional del docente.
     */
    abstract protected function email(): string;

    /**
     * Contraseña inicial del docente.
     */
    abstract protected function password(): string;

    /**
     * Roles que se le asignan al docente.
     *
     * @return array<int, RoleEnum>
     */
    abstract protected function roles(): array;

    /**
     * Datos del perfil docente.
     *
     * @return array<string, string|null>
     */
    abstract protected function professorProfile(): array;

    /**
     * Crea el usuario con sus roles y sincroniza su perfil docente.
     */
    public function run(): void
    {
        $user = $this->createUserWithRoles(
            $this->name(),
            $this->email(),
            $this->password(),
            $this->roles(),
        );

        $this->createProfessorProfile($user, $this->professorProfile());
    }
}
