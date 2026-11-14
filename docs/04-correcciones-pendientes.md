# 04 · Correcciones pendientes

Problemas detectados que **siguen abiertos**. La severidad indica el impacto actual, no
el esfuerzo de resolución.

## Alta

### P-01 · Ruta de página con mayúsculas (`Student/Dashboard/Index`)

- **Archivo:** `app/Http/Controllers/Student/DashboardController.php:131`
- **Problema:** el controlador renderiza `Student/Dashboard/Index`, pero la convención
  del proyecto y el resto de páginas usan minúsculas (`student/dashboard/index`).
  En Windows funciona; en Linux (producción) la resolución de archivos distingue
  mayúsculas y devolvería un error de página inexistente.
- **Solución:** mover `resources/js/pages/Student/Dashboard/Index.tsx` a
  `resources/js/pages/student/dashboard/index.tsx` y actualizar `Inertia::render`.

### P-02 · Escala de notas inconsistente en el portal del estudiante

- **Archivos:** `resources/js/components/student/modules/MisCalificaciones.tsx:20,45`,
  `app/Http/Controllers/Student/DashboardController.php:183-185`
- **Problema:** la interfaz del estudiante muestra “Escala 1-20 · Mín. aprobatoria 10” y
  divide el promedio sobre 20, mientras que el resto de la plataforma (profesor, admin,
  graduado, `Subject::PASSING_GRADE`) usa **0-10 con mínimo 5**. Además, el controlador
  genera los cortes con `min(20, …)`, por lo que puede devolver valores imposibles para
  la escala oficial.
- **Solución:** unificar todo a 0-10, ajustar textos, divisor y generación de cortes; o
  migrar formalmente toda la aplicación a 1-20 con una sola constante compartida.

### P-03 · Datos simulados en el dashboard del estudiante

- **Archivo:** `app/Http/Controllers/Student/DashboardController.php:121,183-185`
- **Estado:** parcial. Los datos personales ya salen del expediente de admisión (cédula,
  nacimiento, turno, período, carrera y solicitud) y `MiPerfil` ya no precarga valores
  inventados. Sigue pendiente:
    - Los cortes N1/N2/N3 se inventan con `rand()`, así que cambian en cada recarga y no
      reflejan evaluaciones reales.
    - `tramites` de ejemplo se mezclan con los de sesión.
- **Solución:** agregar una tabla `evaluations` (o `grade_items`) para los cortes y
  persistir los trámites; eliminar `rand()` y los trámites de ejemplo.

## Media

### P-04 · Dos implementaciones del dashboard de estudiante

- **Archivos:** `resources/js/pages/dashboard/student.tsx` (legacy) y
  `resources/js/pages/Student/Dashboard/Index.tsx` (nuevo).
- **Problema:** el primero ya no se renderiza, pero sigue en el proyecto y puede
  confundir mantenimiento. `DashboardController::studentDashboard()` ignora su parámetro
  `$user` y vuelve a llamar `request()`.
- **Solución:** eliminar la página legacy (con aprobación) y simplificar el método para
  delegar directamente en el controlador del estudiante.

### P-05 · `login-modal.tsx` quedó sin uso

- **Archivo:** `resources/js/components/landing/login-modal.tsx`
- **Problema:** el acceso ahora navega a `/login`; ninguna página importa el modal.
  Mantenerlo duplica la lógica de las tres pestañas y puede desincronizarse.
- **Solución:** eliminarlo (con aprobación) o convertirlo en el componente compartido que
  use la página `/login`.

### P-06 · Passkeys fuera de la nueva página de login

- **Archivo:** `resources/js/pages/auth/login.tsx`
- **Problema:** el rediseño eliminó `<PasskeyVerify />`, aunque el backend de passkeys y
  las rutas siguen activos. Los usuarios con passkey no tienen acceso visible desde
  `/login`.
- **Solución:** volver a incluir el botón de acceso con passkey respetando el nuevo
  diseño, o desactivar la función si no se usará.

### P-07 · Trámites guardados en sesión

- **Archivo:** `app/Http/Controllers/Student/TramiteController.php:33`
- **Problema:** las solicitudes viven en `session('student_tramites')`; se pierden al
  cerrar sesión y no llegan al personal administrativo.
- **Solución:** persistirlas en base de datos (ver módulo pendiente n.º 4).

### P-09 · Módulos administrativos sin operaciones de escritura

- **Archivos:** `app/Http/Controllers/AdminModuleController.php`,
  `app/Enums/Permission.php`, `app/Http/Controllers/AdminStudentProfileController.php`
- **Estado:** parcial. El administrador ya puede ver, editar y eliminar estudiantes;
  falta el alta desde el panel. Profesores, programas y usuarios continúan en solo lectura.
- **Problema:** existen permisos `*.manage` y el catálogo los declara, pero faltan
  operaciones de escritura en varios módulos administrativos.
- **Solución:** implementar las operaciones restantes y protegerlas con los permisos ya
  definidos.

### P-10 · Sin pruebas para el portal estudiantil nuevo

- **Archivos:** `tests/Feature/`
- **Estado:** parcial. `StudentPortalTest` cubre el acceso, el expediente de admisión y la
  actualización de perfil; `PasswordDefinitionTest` cubre el primer acceso. Falta cobertura
  de `student.tramites.store`.
- **Problema:** los cambios recientes de rutas tipadas en los trámites no están cubiertos.
- **Solución:** agregar pruebas de creación de trámites cuando se persistan en base de
  datos (ver P-07).

## Baja

### P-11 · Páginas legacy sin uso

- **Archivos:** `resources/js/pages/welcome.tsx`, `resources/js/pages/dashboard.tsx`
- **Problema:** restos del starter kit; no se renderizan desde ninguna ruta.
- **Solución:** eliminar con aprobación o documentar como referencia.

### P-12 · Datos no deterministas por `rand()`

- **Archivo:** `app/Http/Controllers/Student/DashboardController.php:183-185`
- **Problema:** además de ser ficticios, los cortes cambian en cada petición, lo que
  impide pruebas estables y confunde al usuario.
- **Solución:** incluida en P-03.

### P-13 · Listados administrativos sin paginación

- **Archivo:** `app/Http/Controllers/AdminModuleController.php`
- **Problema:** se cargan todas las filas en memoria y se envían completas al frontend;
  con datos reales (miles de inscripciones) será lento.
- **Solución:** paginación y búsqueda del lado del servidor.

### P-14 · Ruta comodín `admin/{module}`

- **Archivo:** `routes/web.php:30`
- **Problema:** cualquier ruta futura bajo `admin/` (por ejemplo `admin/settings`) sería
  capturada por el comodín si se declara después.
- **Solución:** declarar rutas específicas antes del comodín o restringir el parámetro
  con `whereIn` a las claves del catálogo.

### P-15 · Respuesta del controlador estudiantil ante rol incorrecto

- **Archivo:** `app/Http/Controllers/Student/DashboardController.php:24-26`
- **Problema:** si un usuario autenticado sin rol de estudiante llega al endpoint,
  redirige a `/login` en lugar de devolver `403`, a diferencia del resto del sistema.
- **Solución:** `abort(403)` y dejar la redirección solo para invitados (ya la maneja el
  middleware `auth`).

### P-16 · Constancia de estudios simulada con `alert()`

- **Archivo:** `resources/js/components/student/modules/MiPerfil.tsx`
- **Problema:** el botón “Descargar constancia” solo muestra un aviso de demostración.
- **Solución:** implementar la descarga real (ver módulo pendiente n.º 4) o retirar el
  botón mientras no exista.

### P-17 · Configuración local vs. Herd

- **Archivo:** `.env.example`
- **Problema:** `APP_URL` apunta a `http://localhost:8000`, mientras el sitio se sirve en
  `https://upel2026.test`. Los enlaces absolutos generados en local pueden no coincidir.
- **Solución:** documentar ambos escenarios o ajustar `.env.example`.

### P-18 · Advertencia opcional de fuentes en el build

- **Salida de `npm run build`:** falta el paquete opcional `fontaine`.
- **Problema:** solo es una advertencia; no rompe la compilación.
- **Solución:** instalar `fontaine` o desactivar `optimizedFallbacks` en la configuración
  de fuentes si se quiere un build limpio.

## Seguimiento sugerido

| ID   | Severidad | Estado  |
| ---- | --------- | ------- |
| P-01 | Alta      | Abierto |
| P-02 | Alta      | Abierto |
| P-03 | Alta      | Parcial |
| P-04 | Media     | Abierto |
| P-05 | Media     | Abierto |
| P-06 | Media     | Abierto |
| P-07 | Media     | Abierto |
| P-09 | Media     | Abierto |
| P-10 | Media     | Parcial |
| P-11 | Baja      | Abierto |
| P-12 | Baja      | Abierto |
| P-13 | Baja      | Abierto |
| P-14 | Baja      | Abierto |
| P-15 | Baja      | Abierto |
| P-16 | Baja      | Abierto |
| P-17 | Baja      | Abierto |
| P-18 | Baja      | Abierto |
