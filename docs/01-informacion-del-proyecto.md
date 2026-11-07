# 01 · Información del proyecto

## 1. Identidad

| Campo         | Valor                                                        |
| ------------- | ------------------------------------------------------------ |
| Nombre        | UPEL 2026 · Plataforma Académica                             |
| Institución   | Universidad Pedagógica Experimental Libertador (UPEL)        |
| Tipo          | Aplicación web monolítica con SPA por Inertia                |
| Estado        | En desarrollo activo (landing + portales por rol operativos) |
| Repositorio   | Proyecto local `upel2026` (Herd)                             |
| Dominio local | `https://upel2026.test`                                      |

La plataforma cubre tres frentes:

1. **Sitio público** con la oferta académica, noticias, cursos y fechas de inscripción.
2. **Portales privados** para estudiantes, profesores y graduados.
3. **Portal administrativo** con módulos separados por rol y permisos.

## 2. Stack tecnológico

### Backend

| Paquete                     | Versión              | Uso                                   |
| --------------------------- | -------------------- | ------------------------------------- |
| PHP                         | `^8.3` (entorno 8.5) | Lenguaje del servidor                 |
| Laravel                     | `^13.17`             | Framework base                        |
| Inertia Laravel             | `^3.0`               | Puente servidor → React               |
| Laravel Fortify             | `^1.37`              | Autenticación, 2FA, passkeys, reseteo |
| `spatie/laravel-permission` | `^8.3`               | Roles y permisos                      |
| Laravel Wayfinder           | `^0.1.14`            | Rutas tipadas para TypeScript         |
| Pest                        | `^4.7`               | Pruebas                               |
| Pint                        | `^1.27`              | Formato de código                     |
| Larastan                    | `^3.9`               | Análisis estático                     |

### Frontend

| Paquete           | Versión                | Uso                    |
| ----------------- | ---------------------- | ---------------------- |
| React             | `^19.2`                | Interfaz               |
| Inertia React     | `^3.0`                 | Navegación SPA         |
| TypeScript        | `^5.7` (modo estricto) | Tipado                 |
| Tailwind CSS      | `^4.1`                 | Estilos                |
| Radix UI + shadcn | —                      | Componentes accesibles |
| `lucide-react`    | `^0.475`               | Iconografía            |
| Vite+ (`vp`)      | `1.4`                  | Bundler y tareas       |

### Base de datos

- Motor por defecto: **SQLite** (`database/database.sqlite`).
- Migraciones y seeders reproducen el entorno completo de demostración.

## 3. Estructura del proyecto

```
app/
├── Actions/Fortify/          Creación y reseteo de usuarios
├── Enums/                    Role, Permission, AdmissionStatus, AdmissionDocumentType
├── Http/
│   ├── Controllers/          Landing, dashboards, admin, estudiante, admisiones
│   ├── Middleware/           EnsureAdminPortal, HandleInertiaRequests
│   ├── Requests/             Validaciones (notas, perfil, seguridad, admisiones)
│   └── Responses/            LoginResponse por portal
├── Models/                   Career, Subject, Enrollment, Admission, User, etc.
├── Providers/                AppServiceProvider, FortifyServiceProvider
└── Support/                  AdminModuleCatalog, AdmissionWindow, StudentCodeGenerator

config/
└── admissions.php            Ventana, período, documentos y enlaces de seguimiento

database/
├── migrations/               Esquema completo
└── seeders/                  RolePermission, Academic, DemoUser, Admission

resources/js/
├── components/
│   ├── landing/              Secciones del sitio público
│   ├── portal/               Componentes compartidos de portales
│   └── student/              Portal estudiantil por pestañas
├── data/                     Contenido estático de la landing
├── layouts/                  admin, app, auth, student, admissions
├── pages/                    Páginas Inertia (incluye `admissions/` y `admin/admissions/`)
├── routes/                   Rutas generadas por Wayfinder
└── types/                    Tipos compartidos

routes/
├── web.php                   Rutas públicas y de portales
└── settings.php              Perfil, seguridad y passkeys
```

## 4. Puesta en marcha

```bash
# Dependencias
composer install
npm install

# Entorno
copy .env.example .env
php artisan key:generate

# Base de datos y datos demo
php artisan migrate --seed

# Desarrollo
composer run dev        # o: php artisan serve + npm run dev

# Compilación para producción
npm run build
```

### Verificación

```bash
php artisan test --compact
npm run types:check
vendor/bin/pint --dirty --format agent
```

> Si la interfaz no refleja cambios y no existe `public/hot`, ejecutar
> `npm run build` para regenerar `public/build/manifest.json`.

### Solución de problemas

| Síntoma                                                  | Causa                                                                                                             | Solución                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| La página se ve sin estilos y el HTML referencia `:5173` | Existe `public/hot` (modo dev de Vite) y el servidor de Vite no es accesible desde el navegador o la vista previa | Ejecutar `npm run dev` o eliminar `public/hot` para servir `public/build` |
| “Unable to locate file in Vite manifest”                 | Se editó el frontend sin recompilar y no hay servidor Vite activo                                                 | `npm run build`                                                           |
| Los cambios de React no aparecen                         | Caché del navegador o build antiguo                                                                               | Recargar con caché limpia y reconstruir                                   |

> Con `public/hot` presente, Laravel ignora `public/build`. Para la vista previa de
> Herd se recomienda servir el build (sin `public/hot`) y reconstruir tras cada cambio.

## 5. Fechas clave del calendario

| Hito                     | Fecha y hora             | Constante / origen                          |
| ------------------------ | ------------------------ | ------------------------------------------- |
| Inicio de preinscripción | 2026-11-02 08:00 (GMT-4) | `config/admissions.php` + `AdmissionWindow` |
| Inicio de inscripción    | 2027-01-12 08:00 (GMT-4) | `config/admissions.php` + `AdmissionWindow` |
| Meta de graduación       | 2026-12-12 09:00 (GMT-4) | `config/admissions.php` + `AdmissionWindow` |

Los botones de la landing (`Preinscribirse`, `Inscríbete`), los contadores y el formulario
público de `/preinscripcion` se activan automáticamente cuando el servidor alcanza estas
fechas. En desarrollo se puede forzar la apertura con `ADMISSIONS_FORCE_OPEN=true`.

## 6. Roles y permisos

### Roles (`App\Enums\Role`)

| Rol                     | Valor                     | Portal         | Alcance                   |
| ----------------------- | ------------------------- | -------------- | ------------------------- |
| Estudiante              | `estudiante`              | Público        | Campus del estudiante     |
| Profesor                | `profesor`                | Público        | Carga de notas y materias |
| Graduado                | `graduado`                | Público        | Récord y programas        |
| Administrador           | `admin`                   | Administrativo | Control total             |
| Decano                  | `decano`                  | Administrativo | Académico + financiero    |
| Coordinador académico   | `coordinador_academico`   | Administrativo | Académico                 |
| Personal administrativo | `personal_administrativo` | Administrativo | Financiero                |

### Matriz de permisos (`App\Enums\Permission`)

| Rol                     | Permisos                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estudiante              | `portal.estudiante`                                                                                                                               |
| Profesor                | `portal.profesor`                                                                                                                                 |
| Graduado                | `portal.graduado`                                                                                                                                 |
| Coordinador académico   | `dashboard.view` + académicos (`students`, `professors`, `careers`, `subjects`, `schedules`, `grades`, `admissions`, `programs`: ver y gestionar) |
| Personal administrativo | `dashboard.view` + `finance.view`, `finance.manage`                                                                                               |
| Decano                  | Académicos + financieros                                                                                                                          |
| Administrador           | Todos, incluidos `users.*`, `roles.manage`, `settings.manage`                                                                                     |

## 7. Credenciales de demostración

| Perfil                  | Correo                       | Contraseña             |
| ----------------------- | ---------------------------- | ---------------------- |
| Administrador           | `admin@upel.edu.ve`          | `Admin12345!`          |
| Decano                  | `decano@upel.edu.ve`         | `Decano12345!`         |
| Coordinador académico   | `coordinador@upel.edu.ve`    | `Coordinador12345!`    |
| Personal administrativo | `administrativo@upel.edu.ve` | `Administrativo12345!` |
| Estudiante              | `estudiante@upel.edu.ve`     | `Estudiante12345!`     |
| Profesor                | `profesor@upel.edu.ve`       | `Profesor12345!`       |
| Graduado                | `graduado@upel.edu.ve`       | `Graduado12345!`       |

> El estudiante de demostración es **María Fernanda Pérez** (Educación Primaria, 5.º
> semestre). El profesor es **Dra. Carmen Alicia Rojas**. El graduado es **Pedro José
> González** (Lengua y Literatura).

## 8. Modelo de datos

| Tabla                                     | Propósito                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `users`                                   | Cuentas de todos los portales (`must_change_password` marca la contraseña inicial)   |
| `careers`                                 | Oferta de pregrado (14 registros sembrados)                                          |
| `academic_periods`                        | Períodos lectivos (`2025-II`, `2026-I`, `2026-II`, …)                                |
| `subjects`                                | Unidades curriculares por carrera y semestre (155 registros)                         |
| `schedules`                               | Horarios por carrera, período, cohorte, tipo y rango de clases                       |
| `schedule_subjects`                       | Materia, docente, fechas y hora elegidos para cada franja de un horario (`position`) |
| `student_profiles`                        | Datos académicos del estudiante/graduado                                             |
| `professor_profiles`                      | Código, departamento y título del docente                                            |
| `professor_subjects`                      | Asignación docente ↔ materia                                                         |
| `enrollments`                             | Inscripción, nota final y estado (`cursando`, `aprobado`, `reprobado`)               |
| `programs`                                | Especializaciones, maestrías, doctorados, cursos y talleres (9 registros)            |
| `payments`                                | Pagos y mensualidades (8 registros)                                                  |
| `admissions`                              | Solicitudes de preinscripción, estado, revisión y conversión                         |
| `career_offerings`                        | Modalidad, horario y turno ofrecidos por cada carrera                                |
| `high_schools`                            | Catálogo de planteles de bachillerato (15 registros sembrados)                       |
| `admission_documents`                     | Expediente de documentos por aspirante y su revisión                                 |
| `admission_status_histories`              | Historial de cambios de estado de cada solicitud                                     |
| `newsletter_subscribers`                  | Suscripciones del sitio público                                                      |
| `roles`, `permissions`, `model_has_roles` | Spatie                                                                               |

### Regla de calificación

- Escala oficial de la plataforma: **0 a 10**.
- Nota mínima aprobatoria: `Subject::PASSING_GRADE = 5.0`.
- El profesor registra la nota con dos decimales; el sistema deriva el estado
  `aprobado` o `reprobado` automáticamente.

## 9. Rutas principales

| Método | URI                                                      | Nombre                                | Acceso                              |
| ------ | -------------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| GET    | `/`                                                      | `landing`                             | Público                             |
| POST   | `/newsletter`                                            | `newsletter.store`                    | Público (throttle 6/min)            |
| GET    | `/preinscripcion`                                        | `admissions.create`                   | Público (ventana de admisión)       |
| POST   | `/preinscripcion`                                        | `admissions.store`                    | Público (throttle 10/min)           |
| GET    | `/preinscripcion/estado`                                 | `admissions.lookup`                   | Público                             |
| POST   | `/preinscripcion/estado`                                 | `admissions.lookup.submit`            | Público (throttle 8/min)            |
| GET    | `/preinscripcion/solicitud/{code}`                       | `admissions.show`                     | Enlace firmado                      |
| POST   | `/preinscripcion/solicitud/{code}/documentos`            | `admissions.documents.store`          | Enlace firmado (throttle 12/min)    |
| DELETE | `/preinscripcion/solicitud/{code}/documentos/{document}` | `admissions.documents.destroy`        | Enlace firmado                      |
| GET    | `/login`                                                 | `login`                               | Invitados                           |
| GET    | `/definir-contrasena`                                    | `password.define`                     | Autenticados con contraseña inicial |
| PUT    | `/definir-contrasena`                                    | `password.define.update`              | Autenticados con contraseña inicial |
| GET    | `/admin`                                                 | `admin.entry`                         | Público (redirige al portal)        |
| GET    | `/admin/login`                                           | `admin.login`                         | Invitados                           |
| GET    | `/admin/dashboard`                                       | `admin.dashboard`                     | Admin + `EnsureAdminPortal`         |
| GET    | `/admin/admissions`                                      | `admin.admissions.index`              | `admissions.view`                   |
| GET    | `/admin/admissions/{code}`                               | `admin.admissions.show`               | `admissions.view`                   |
| PATCH  | `/admin/admissions/{code}/status`                        | `admin.admissions.status`             | `admissions.manage`                 |
| POST   | `/admin/admissions/{code}/convert`                       | `admin.admissions.convert`            | `admissions.manage`                 |
| PATCH  | `/admin/admissions/{code}/documents/{document}`          | `admin.admissions.documents.review`   | `admissions.manage`                 |
| GET    | `/admin/admissions/{code}/documents/{document}`          | `admin.admissions.documents.download` | `admissions.view`                   |
| GET    | `/admin/admissions/{code}/documents/{document}/ver`      | `admin.admissions.documents.preview`  | `admissions.view`                   |
| GET    | `/admin/{module}`                                        | `admin.module`                        | Permiso del módulo                  |
| GET    | `/dashboard`                                             | `dashboard`                           | Autenticados y verificados          |
| PUT    | `/dashboard/notas/{enrollment}`                          | `professor.grades.update`             | Rol profesor                        |
| GET    | `/estudiante/dashboard`                                  | `student.dashboard`                   | Rol estudiante                      |
| PUT    | `/estudiante/perfil`                                     | `student.profile.update`              | Rol estudiante                      |
| POST   | `/estudiante/tramites`                                   | `student.tramites.store`              | Rol estudiante                      |
| —      | `/settings/*`                                            | `profile.*`, `security.*`             | Autenticados                        |

## 10. Convenciones del proyecto

- Comentarios, textos de interfaz y documentación en **español**.
- Componentes React en `PascalCase`; páginas Inertia en `kebab-case` o carpetas.
- Nombres de variables y métodos descriptivos (`isRegisteredForDiscounts`).
- Uso obligatorio de **Wayfinder** para rutas en el frontend (`@/routes`, `@/actions`).
- Formato PHP con **Pint** y tipado estricto en TypeScript.
- No crear carpetas base nuevas sin aprobación.
