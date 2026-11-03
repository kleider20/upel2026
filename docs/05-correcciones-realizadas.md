# 05 · Correcciones realizadas

Historial de fallos corregidos y verificados. Las fechas corresponden al cierre de cada
corrección.

## Octubre 2026

### C-01 · Permisos no reconocidos después de sembrarlos

- **Síntoma:** tras ejecutar `RolePermissionSeeder`, los permisos recién creados no
  existían para Spatie y las comprobaciones fallaban.
- **Causa:** la caché interna de `PermissionRegistrar` conservaba el estado anterior.
- **Corrección:** llamar a `forgetCachedPermissions()` antes y después de crear permisos
  y roles.
- **Archivo:** `database/seeders/RolePermissionSeeder.php`
- **Verificación:** `php artisan migrate:fresh --seed` y pruebas de `AdminPortalTest`.

### C-02 · Redirección incorrecta después del login

- **Síntoma:** un administrador autenticado desde `/login` terminaba en `/dashboard` y
  recibía un `403`.
- **Causa:** Fortify usaba la respuesta de login por defecto.
- **Corrección:** `LoginResponse` personalizado que envía a `admin.dashboard` cuando el
  usuario pertenece al portal administrativo y a `dashboard` en caso contrario.
- **Archivos:** `app/Http/Responses/LoginResponse.php`,
  `app/Providers/FortifyServiceProvider.php`
- **Verificación:** `tests/Feature/Auth/AuthenticationTest.php`.

### C-03 · Acceso al portal administrativo sin rol

- **Síntoma:** cualquier usuario autenticado podía abrir `/admin/dashboard`.
- **Causa:** las rutas administrativas solo tenían el middleware `auth`.
- **Corrección:** middleware `EnsureAdminPortal` que exige uno de los roles
  administrativos y redirige a invitados al login administrativo.
- **Archivos:** `app/Http/Middleware/EnsureAdminPortal.php`, `routes/web.php`,
  `bootstrap/app.php`
- **Verificación:** `tests/Feature/AdminPortalTest.php`.

### C-04 · `TypeError` al listar pagos en el módulo de finanzas

- **Síntoma:** `/admin/finance` lanzaba un `TypeError` al formatear fechas.
- **Causa:** el método privado `date()` tipaba `?Illuminate\Support\Carbon`, pero la
  aplicación usa `CarbonImmutable` globalmente (`Date::use(CarbonImmutable::class)`).
- **Corrección:** cambiar la firma a `?CarbonInterface` y eliminar el import sin uso.
- **Archivo:** `app/Http/Controllers/AdminModuleController.php`
- **Verificación:** `tests/Feature/AdminPortalTest.php` y navegación manual del módulo.

### C-05 · `ViteException` en `/admin/dashboard`

- **Síntoma:** “Unable to locate file in Vite manifest” al entrar al panel
  administrativo.
- **Causa:** el bundle administrativo no estaba en `public/build/manifest.json` porque
  no se había recompilado tras crear las páginas.
- **Corrección:** ejecutar `npm run build` y confirmar la entrada del chunk en el
  manifiesto.
- **Archivos:** `public/build/manifest.json` (generado)
- **Verificación:** carga correcta de `/admin/dashboard` y `npm run build` sin errores.

### C-06 · `usePage must be used within the Inertia component`

- **Síntoma:** error en consola al montar cualquier página; `FlashMessages` se renderizaba
  fuera del contexto de Inertia.
- **Causa:** el componente se montaba en el envoltorio global `withApp` de `app.tsx`.
- **Corrección:** retirarlo de `withApp` e incluirlo dentro de cada layout
  (`auth-layout`, `app-layout`, `admin-layout`, `student-layout`).
- **Archivos:** `resources/js/app.tsx`, `resources/js/layouts/*.tsx`
- **Verificación:** navegación completa por landing, login y paneles sin errores de
  consola.

### C-07 · El botón “Iniciar sesión” abría un modal en la landing

- **Síntoma:** al pulsar “Iniciar sesión” se abría una ventana flotante sobre la landing
  en lugar de navegar a una página de login.
- **Causa:** la landing gestionaba el estado `loginOpen` y renderizaba `LoginModal`.
- **Corrección:** eliminar el estado y el modal de la landing; todos los accesos
  (`Navbar`, `HeroSlider`, `CTA`, `Footer`) navegan a `/login`.
- **Archivos:** `resources/js/pages/landing/index.tsx`
- **Verificación:** clic en cada botón de acceso y comprobación de la URL `/login`.

### C-08 · `/login` no mostraba las pestañas de rol

- **Síntoma:** la página `/login` seguía mostrando el formulario genérico del starter kit
  en lugar del diseño de tres pestañas.
- **Causa:** la página `auth/login.tsx` conservaba el formulario original.
- **Corrección:** reescribir la página como tarjeta de pantalla completa con pestañas
  **Estudiante / Graduado / Profesor**, campo oculto `portal`, validaciones, enlace de
  recuperación y acceso al portal administrativo. `Login.layout = null` para no usar el
  layout de autenticación.
- **Archivos:** `resources/js/pages/auth/login.tsx`
- **Verificación:** `tests/Feature/Auth/AuthenticationTest.php` (login por portal) y
  revisión visual en `/login`.

### C-09 · Build roto por `useNavigate` inexistente

- **Síntoma:** `[MISSING_EXPORT] "useNavigate" is not exported by "@inertiajs/react"`.
- **Causa:** `@inertiajs/react` v3 no expone `useNavigate` (no usa React Router).
- **Corrección:** usar `router.visit('/login')` en la landing y eliminar el import.
- **Archivo:** `resources/js/pages/landing/index.tsx`
- **Verificación:** `npm run build` y `npm run types:check`.

### C-10 · Archivos basura en la raíz del repositorio

- **Síntoma:** aparecían archivos vacíos llamados `email}` e `id}`.
- **Causa:** redirecciones de shell mal escapadas durante una sesión anterior.
- **Corrección:** eliminarlos.
- **Verificación:** `git status` limpio de esos archivos.

### C-11 · `route()` no definido en el portal estudiantil

- **Síntoma:** `npm run types:check` fallaba con `Cannot find name 'route'` en tres
  componentes; al ejecutarse, el cierre de sesión y los formularios de perfil/trámites
  lanzarían un `ReferenceError`.
- **Causa:** los componentes usaban el helper global `route()` de Ziggy, que no está
  instalado; el proyecto usa Wayfinder.
- **Corrección:** importar las rutas tipadas generadas:
  - `logout` desde `@/routes`
  - `update` desde `@/routes/student/profile`
  - `store` desde `@/routes/student/tramites`
- **Archivos:** `resources/js/components/student/Sidebar.tsx`,
  `resources/js/components/student/modules/MiPerfil.tsx`,
  `resources/js/components/student/modules/MisTramites.tsx`
- **Verificación:** `npm run types:check` sin errores; `php artisan test --compact`
  (76 pruebas aprobadas).

### C-12 · Formato de código y tipos

- **Corrección:** ejecución de `vendor/bin/pint --dirty --format agent` y
  `npm run types:check` tras cada bloque de cambios.
- **Verificación:** sin diferencias de formato ni errores de TypeScript.

### C-13 · `TypeError` en consola al abrir `/admin/subjects/create`

- **Síntoma:** `Uncaught TypeError: Cannot read properties of undefined (reading 'normalize')`
  al cargar el formulario de materia.
- **Causa:** `toAscii()` recibía `undefined` (nombre o modalidad sin valor) y llamaba
  `.normalize()` directamente.
- **Corrección:** `toAscii()` acepta `string | null | undefined` y normaliza con
  `String(value ?? '')`; `SubjectCodeInput.name` pasa a ser opcional.
- **Archivos:** `resources/js/lib/subject-code.ts`, `resources/js/pages/admin/subjects/form.tsx`
- **Verificación:** `/admin/subjects/create` sin errores de consola; `npm run types:check`
  y `npm run build` correctos.

### C-14 · Carreras no oficiales en el sistema

- **Síntoma:** el selector de carrera y el listado administrativo mostraban 14 carreras,
  incluidas ADMEDU, CIENBIO, CIENSOC, EDFIS, EDINI, EDINT, EDRURAL, IDIOMAS, MATFIS y
  TECEDU; además los códigos eran `GEOHIS` y `LENLIT` en lugar de los oficiales.
- **Causa:** el seeder sembraba carreras históricas y nunca eliminaba las que ya no
  pertenecen al plan vigente.
- **Corrección:** `AcademicSeeder` siembra solo EDPRI, EDESP, GEHIS y LENLI, renombra los
  códigos históricos para conservar sus pensum y elimina el resto con `delete()` (el
  cascade limpia ofertas y materias). Se actualizaron `PensumSeeder`, `DemoUserSeeder` y
  `AdmissionSeeder` a los códigos nuevos.
- **Archivos:** `database/seeders/AcademicSeeder.php`, `database/seeders/PensumSeeder.php`,
  `database/seeders/DemoUserSeeder.php`, `database/seeders/AdmissionSeeder.php`
- **Verificación:** `php artisan db:seed` deja 4 carreras con 39 materias cada una y el
  selector de `/admin/subjects/create` solo muestra las oficiales.

## Noviembre 2026

### P-08 · Valores por defecto ficticios en “Mi perfil”

- **Síntoma:** si el perfil no tenía datos, el formulario de “Mi perfil” precargaba
  teléfono, dirección y contacto de emergencia inventados, y al guardar escribía esos
  datos falsos en la base de datos.
- **Causa:** valores literales en los `??` del `useForm`.
- **Corrección:** usar cadena vacía como valor inicial; además el perfil toma cédula,
  nacimiento, período y turno reales del expediente de admisión y muestra `—` cuando no
  hay dato.
- **Archivos:** `resources/js/components/student/modules/MiPerfil.tsx`,
  `app/Http/Controllers/Student/DashboardController.php`
- **Verificación:** `tests/Feature/StudentPortalTest.php` y revisión visual de la pestaña
  “Mi Perfil”.

## Resumen de verificación final

| Comprobación | Resultado |
| --- | --- |
| `php artisan test --compact` | 163 pruebas · 163 aprobadas · 887 aserciones |
| `npm run types:check` | Sin errores |
| `vendor/bin/pint --dirty --format agent` | Sin cambios pendientes |
| `npm run build` | Compilación correcta |
| Navegación manual | Landing → `/login` → `/definir-contrasena` → panel del estudiante · `/preinscripcion` → seguimiento → bandeja administrativa |
