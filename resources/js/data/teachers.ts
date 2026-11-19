/**
 * Docente del claustro publicado en la landing. Los datos salen del perfil
 * docente registrado en la base de datos; `avatar_url` es la fotografía tipo
 * carnet que el profesor carga desde su portal.
 */

export type LandingTeacher = {
    id: number;
    name: string;
    role: string;
    bio: string;
    email: string;
    avatar_url: string | null;
};
