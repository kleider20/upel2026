# 02 · Módulos actuales y funcionalidades

Este documento describe lo que la aplicación **ya hace** al 2 de noviembre de 2026.

## 1. Sitio público (landing)

**Ruta:** `GET /` · **Nombre:** `landing`
**Controlador:** `App\Http\Controllers\LandingController`
**Página:** `resources/js/pages/landing/index.tsx`

### Secciones implementadas

| Sección | Componente | Funcionalidad |
| --- | --- | --- |
| Barra de navegación | `navbar.tsx` | Sticky, enlaces ancla a secciones, menú móvil, botón de acceso que navega a `/login`. |
| Hero | `hero-slider.tsx` | 5 diapositivas (institucional, noticia, congreso, preinscripción, portal), autoplay de 7 s con pausa al pasar el cursor o al ocultar la pestaña, flechas, puntos y navegación por teclado. |
| Cifras | `stats-band.tsx` | Contadores animados con `IntersectionObserver`. |
| Nosotros | `about.tsx` | Historia institucional y sellos oficiales UPEL / IMPM en SVG. |
| Carreras | `careers.tsx` | 12 carreras con filtros por modalidad (todas, presencial, mixta, online). |
| Modalidad online | `online-mode.tsx` | Bloque oscuro con 4 tarjetas de vidrio. |
| Cursos | `courses.tsx` | 6 cursos y talleres con precio, duración y modalidad. |
| Profesores | `teachers.tsx` | Carrusel de 12 docentes con especialidad y avatar. |
| Noticias | `news.tsx` | 6 noticias con arte generado. |
| Graduaciones | `graduations.tsx` | Cuenta regresiva a la meta de graduación. |
| Llamado final | `cta.tsx` | CTA con estado dinámico según las fechas de inscripción. |
| Pie de página | `footer.tsx` | Enlaces, contacto, sellos y acceso a login. |

### Comportamiento por fechas

- Antes del **2026-11-02 08:00 (GMT-4)**: el botón de preinscripción se muestra
  deshabilitado con cuenta regresiva.
- Entre preinscripción e inscripción: se habilita la preinscripción.
- Desde el **2027-01-12 08:00 (GMT-4)**: se habilita la inscripción formal.

### Extras del sitio público

- SEO: metadatos `description`, Open Graph, Twitter Card y `theme-color`.
- Accesibilidad: enlace “Saltar al contenido principal”, `aria-*` en tabs y carrusel,
  foco visible.
- `LandingErrorBoundary` evita que un fallo de una sección rompa toda la página.
- Newsletter: `POST /newsletter` valida correo único y aplica `throttle:6,1`.

## 2. Admisión en línea (preinscripción)

**Rutas públicas:** `/preinscripcion` (`admissions.create`) y `/preinscripcion/estado`
(`admissions.lookup`)
**Controladores:** `AdmissionController`, `AdmissionLookupController`
**Páginas:** `resources/js/pages/admissions/apply.tsx`, `status.tsx`, `closed.tsx`

### Formulario público

- Datos personales (nombres, apellidos, nacionalidad, cédula, nacimiento, género, correo,
  teléfono y dirección).
- Solo aparecen las carreras activas que tienen al menos una oferta activa en
  `career_offerings`; la modalidad, el horario y el turno se limitan a los valores de esas
  ofertas y se ajustan automáticamente al cambiar de carrera o modalidad.
- Récord de bachillerato: plantel, año de graduación y promedio 0–20. El plantel se elige
  con un autocompletado que sugiere los nombres del catálogo `high_schools` sin distinguir
  mayúsculas ni acentos; si el aspirante escribe uno nuevo, se agrega al catálogo al enviar
  la solicitud (`HighSchool::firstOrCreate`).
- `HighSchoolSeeder` carga 15 planteles iniciales (liceos y unidades educativas de Caracas).
- Validación en `StoreAdmissionRequest`: edad mínima de 15 años, cédula única por
  convocatoria, correo sin cuenta previa, aceptación de las condiciones y que la
  combinación carrera/modalidad/horario/turno corresponda a una oferta activa.
- Genera el código de aspirante `ASP-{año}-{secuencia}` (`Admission::nextCode()`), guarda
  el estado `recibida` y el primer registro de `admission_status_histories`.
- La ventana la controla `AdmissionWindow` + `config/admissions.php`: antes del
  2 de noviembre de 2026 se muestra `admissions/closed` con cuenta regresiva;
  `ADMISSIONS_FORCE_OPEN` permite probar el flujo en desarrollo.
- El envío aplica `throttle:10,1` y responde con la URL firmada de seguimiento.

### Expediente de documentos

- Cuatro documentos obligatorios definidos en `AdmissionDocumentType`: título de
  bachiller, notas certificadas, cédula de identidad y fotografía tipo carnet.
- Formatos PDF/JPG/PNG (la foto solo imagen) y límite de 5 MB configurable
  (`ADMISSIONS_DOCUMENTS_MAX_KB`).
- Carga y reemplazo mediante enlaces firmados de 60 días; el aspirante puede borrar y
  volver a subir mientras la solicitud siga abierta.
- La administración valida o rechaza cada documento con observaciones
  (`ReviewAdmissionDocumentRequest`).

### Seguimiento del aspirante

- Consulta por correo y cédula en `/preinscripcion/estado` (`throttle:8,1`); abre el
  enlace firmado de la solicitud más reciente que coincida con ambos datos.
- Vista con datos, estado, documentos faltantes y línea de tiempo de cambios.
- La carga de documentos solo se habilita en los estados `recibida`, `en_revision` y
  `observada`.
- Cuando la solicitud está `convertida`, se muestra una tarjeta con los datos de acceso:
  código de estudiante, correo registrado, contraseña inicial (la cédula sin la letra ni
  puntos mientras el estudiante no la haya cambiado), carrera, período de ingreso y fecha
  de creación de la cuenta. Incluye el botón **Ir al campus** (`/login`). El antiguo enlace
  firmado `admissions.access` se retiró porque la cédula ya permite el primer acceso.

### Bandeja administrativa

- `/admin/admissions`: filtros por estado, búsqueda por código/cédula/nombre/correo,
  paginación y tarjetas de resumen.
- `/admin/admissions/{code}`: expediente completo, descarga de archivos, apertura del
  documento en una pestaña nueva (PDF/JPG/PNG servidos inline), validación de documentos y
  cambio de estado.
- Flujo `recibida → en_revision → observada / aprobada / rechazada`; no permite aprobar si
  faltan documentos obligatorios.
- Cada cambio guarda `reviewed_by`, `reviewed_at`, la nota y el historial en
  `admission_status_histories`.
- La conversión (`POST /admin/admissions/{code}/convert`) crea el usuario con el correo de
  la solicitud y la **cédula como contraseña inicial**, marca `must_change_password`,
  asigna el rol `estudiante`, genera el `student_profile` con código de estudiante y envía
  el correo con las credenciales. Solo aplica a solicitudes `aprobada` sin usuario previo.

### Correos transaccionales

- `AdmissionReceived` (confirmación y código), `AdmissionStatusChanged` (nuevo estado y
  observación) y `AdmissionConverted` (credenciales: correo, cédula inicial y enlace al
  campus), todos en cola.
- Plantillas en `resources/views/mail/admissions/`.

### Permisos

- `admissions.view` para consultar y `admissions.manage` para cambiar estados, revisar
  documentos y convertir aspirantes.

> La **inscripción formal / matrícula en línea** (selección de materias y pago) sigue
> pendiente: por ahora solo existe la fecha de apertura (`isEnrollmentOpen`) que usan la
> landing y los módulos futuros.

## 3. Autenticación

### Login unificado `/login`

**Componente:** `resources/js/pages/auth/login.tsx` (sin layout, pantalla completa)
**Controlador:** Laravel Fortify (`AuthenticatedSessionController@create/store`)

- Tarjeta centrada sobre fondo institucional con el sello UPEL.
- Tres pestañas: **Estudiante**, **Graduado** y **Profesor**.
- Cada pestaña cambia el texto descriptivo, la etiqueta del botón y el campo oculto
  `portal` que viaja a Fortify.
- Campos: `Correo`, `Contraseña`, “Mantener mi sesión iniciada”.
- Enlace “¿La olvidaste?” hacia `password.request`.
- Enlace secundario al portal administrativo (`/admin/login`).
- Validación de errores por campo y estado `processing`.
- Aviso para recién admitidos: la contraseña inicial es la cédula sin la letra ni puntos.
- Al autenticar, `LoginResponse` redirige según el rol y envía a `/definir-contrasena` a
  quien tenga la contraseña inicial pendiente.

### Primer acceso del estudiante

**Rutas:** `GET/PUT /definir-contrasena` · **Nombres:** `password.define`,
`password.define.update`
**Controlador:** `App\Http\Controllers\Auth\PasswordDefinitionController`
**Componente:** `resources/js/pages/auth/define-password.tsx`

- El middleware `EnsurePasswordIsDefined` (alias `password.defined`) bloquea `dashboard`,
  `student.*` y `settings.*` mientras `must_change_password` siga activo; solo permite la
  propia definición y el cierre de sesión.
- El formulario muestra el correo registrado (no editable), pide contraseña y
  confirmación con `Password::defaults()` y, al guardar, limpia la bandera y entra al
  campus.
- `ResetUserPassword` y el cambio desde `settings/security` también limpian la bandera.

### Restablecimiento de contraseña

- `auth/reset-password.tsx` comparte la presentación de `/login`: tarjeta centrada, fondo
  institucional y campos con iconos. El campo de contraseña vive en
  `resources/js/components/password-field.tsx` y se reutiliza en `define-password.tsx`.

### Regla de portal

`FortifyServiceProvider::configureAuthentication()` valida que el usuario tenga el rol
del portal elegido:

| `portal` enviado | Roles aceptados |
| --- | --- |
| `estudiante` | `estudiante` |
| `profesor` | `profesor` |
| `graduado` | `graduado` |
| `admin` | `admin`, `decano`, `coordinador_academico`, `personal_administrativo` |

Si el correo existe pero pertenece a otro portal, se devuelve un mensaje específico
(“No existe ninguna cuenta de estudiante registrada con este correo.”, etc.).

### Portal administrativo

- `GET /admin` → `AdminEntryController` decide si mostrar login o entrar al panel.
- `GET /admin/login` → `admin/login.tsx`, formulario con `portal=admin`.
- Middleware `EnsureAdminPortal` bloquea a cualquier usuario sin rol administrativo.
- Invitados en rutas `admin/*` son redirigidos a `admin.login` (no a `/login`).

### Funciones heredadas de Fortify

- Restablecimiento de contraseña.
- Verificación de correo.
- Confirmación de contraseña.
- Autenticación de dos factores (TOTP y códigos de recuperación).
- Passkeys (backend y página de verificación disponibles).
- Límite de intentos: 5 por minuto por correo + IP.

## 4. Portal del estudiante

**Ruta principal:** `GET /estudiante/dashboard` · **Nombre:** `student.dashboard`
**Controlador:** `App\Http\Controllers\Student\DashboardController`
**Página:** `resources/js/pages/Student/Dashboard/Index.tsx`

Portal de una sola página con barra lateral y 9 módulos conmutables por pestaña:

| Pestaña | Componente | Funcionalidad |
| --- | --- | --- |
| Inicio | `modules/Inicio.tsx` | Saludo, resumen de promedio, materias, créditos, avance, franja de la solicitud de admisión y accesos rápidos. |
| Mi solicitud | `modules/MiSolicitud.tsx` | Expediente de admisión completo: datos personales y académicos, récord de bachillerato, documentos, historial y observaciones. |
| Mis materias | `modules/MisMaterias.tsx` | Inscripciones con período, profesor, créditos y estado. |
| Mis calificaciones | `modules/MisCalificaciones.tsx` | Cortes N1/N2/N3, nota final y estado por materia. |
| Mis profesores | `modules/MisProfesores.tsx` | Docentes de las materias inscritas con departamento y materias. |
| Mi carrera y pénsum | `modules/MiCarreraPensum.tsx` | Mapa curricular por período con estado aprobado/cursando/pendiente y marca de libre elección (UNCLE). |
| Mi horario | `modules/MiHorario.tsx` | Horario oficial de actividades presenciales filtrado por el horario de preinscripción, con impresión y descarga en CSV. |
| Mi perfil | `modules/MiPerfil.tsx` | Datos reales del aspirante (cédula, nacimiento, período, turno) y formulario de actualización (`PUT /estudiante/perfil`). |
| Mis trámites | `modules/MisTramites.tsx` | Solicitud de constancias y solvencias (`POST /estudiante/tramites`). |

- `Student\DashboardController` envía `admission` con la solicitud que originó la cuenta
  (datos, documentos e historial) y completa el perfil con esos datos cuando el
  `student_profile` no los tiene; ya no inventa valores personales.

- `App\Support\StudentSchedule` transcribe el horario oficial de Educación Primaria
  período 1 y lo filtra por el horario de estudio del estudiante; `MiHorario` lo
  imprime o lo descarga en CSV.

- La barra lateral (`components/student/Sidebar.tsx`) agrupa “Mi vida académica” y
  “Cuenta y Servicios”, e incluye cierre de sesión.
- La barra superior (`components/student/Topbar.tsx`) muestra el título del módulo y el
  usuario autenticado.
- `StudentLayout` incorpora `FlashMessages` para los avisos de éxito.

> Existe además un dashboard anterior en `resources/js/pages/dashboard/student.tsx`
> que ya no se utiliza para estudiantes (ver correcciones pendientes).

## 5. Portal del profesor

**Ruta:** `GET /dashboard` (mismo endpoint que graduado; el controlador decide)
**Controlador:** `DashboardController::professorDashboard`
**Página:** `resources/js/pages/dashboard/professor.tsx`

- Resumen: carreras, materias, estudiantes, notas pendientes, notas cargadas y promedio.
- Estudiantes agrupados por carrera y materia.
- Navegación “drill-down”: carrera → materias → estudiantes.
- Botón de carga de nota por estudiante que abre `components/portal/grade-modal.tsx`.
- Envío a `PUT /dashboard/notas/{enrollment}` con middleware `role:profesor`.
- Validación en `UpdateGradeRequest`: nota numérica entre 0 y 10.
- Al guardar, `ProfessorGradeController` redondea a 2 decimales y fija
  `aprobado`/`reprobado` según `Subject::PASSING_GRADE` (5.0).
- Solo puede calificar inscripciones de materias que imparte.

## 6. Portal del graduado

**Ruta:** `GET /dashboard`
**Controlador:** `DashboardController::graduateDashboard`
**Página:** `resources/js/pages/dashboard/graduate.tsx`

- Resumen: promedio, materias culminadas, créditos y programas disponibles.
- Récord académico completo con notas finales por materia y período.
- Oferta agrupada por tipo: especializaciones, maestrías, doctorados, cursos y talleres.
- Datos del perfil de egresado (carrera, promoción, estado).

## 7. Portal administrativo

**Rutas:** `/admin/dashboard` y `/admin/{module}`
**Controladores:** `AdminDashboardController`, `AdminModuleController`
**Catálogo:** `App\Support\AdminModuleCatalog`

### Módulos disponibles

| Módulo | Permiso | Contenido |
| --- | --- | --- |
| `admissions` | `admissions.view` | Bandeja de preinscripciones, expediente, documentos y conversión (páginas propias). |
| `students` | `students.view` | Expedientes, carrera, semestre, estado y promedio. |
| `professors` | `professors.view` | Plantilla docente, departamento, título y materias. |
| `careers` | `careers.view` | Oferta académica, modalidad, duración, materias y estudiantes. |
| `subjects` | `subjects.view` | Unidades curriculares, créditos, docentes e inscritos. |
| `grades` | `grades.view` | Calificaciones globales, promedio, aprobadas y sin nota. |
| `finance` | `finance.view` | Recaudado, por cobrar, vencidos y detalle de pagos. |
| `programs` | `programs.view` | Postgrados, cursos y talleres. |
| `users` | `users.view` | Cuentas, roles, verificación y fecha de registro. |
| `roles` | `roles.manage` | Roles, permisos, usuarios y alcance. |

### Visibilidad por rol

| Rol | Módulos visibles |
| --- | --- |
| Administrador | Todos |
| Decano | Académicos + finanzas |
| Coordinador académico | Académicos |
| Personal administrativo | Finanzas |

- `AdminDashboardController` construye las tarjetas a partir del catálogo y de los
  permisos del usuario.
- `AdminAdmissionController` implementa el flujo de admisiones con escritura (estados,
  revisión de documentos y conversión); carreras y materias tienen sus propios
  controladores CRUD. El resto de módulos del catálogo sigue en solo lectura.
- `AdminModuleController` valida permiso antes de responder y devuelve `403` si falta.
- La tabla se renderiza con `resources/js/pages/admin/resource.tsx` (columnas, filas,
  tonos y estadísticas).

## 8. Configuración de cuenta

**Rutas:** `routes/settings.php`

| Página | Ruta | Funcionalidad |
| --- | --- | --- |
| Perfil | `/settings/profile` | Nombre, correo, verificación y eliminación de cuenta. |
| Seguridad | `/settings/security` | Contraseña, autenticación de dos factores y passkeys. |
| Apariencia | `/settings/appearance` | Tema claro/oscuro/sistema. |

## 9. Modelo académico y datos

- `AcademicSeeder` carga las 4 carreras oficiales (EDPRI, EDESP, GEHIS y LENLI) con sus
  ofertas y 9 programas; elimina cualquier otra carrera y reasigna los códigos históricos
  `GEOHIS` y `LENLIT`.
- `PensumSeeder` carga 156 materias a partir de los pensum oficiales de esas carreras.
- `SubjectCode` (`app/Support/SubjectCode.php`) y `resources/js/lib/subject-code.ts` generan
  el código de la materia desde el nombre, el periodo y la modalidad
  (`ApreMateI-PA1PRE`). En creación se recalcula en vivo; la edición manual se respeta y
  puede regenerarse con el botón **Regenerar**.
- `DemoUserSeeder` crea 13 usuarios, perfiles, inscripciones, notas y pagos de ejemplo.
- `AdmissionSeeder` agrega solicitudes de admisión de muestra con distintos estados y
  documentos para probar la bandeja administrativa.
- `RolePermissionSeeder` crea los 7 roles y todos los permisos, y limpia la caché de
  Spatie después de crearlos.

## 10. Pruebas automatizadas

| Archivo | Cobertura |
| --- | --- |
| `tests/Feature/LandingPageTest.php` | Landing, fechas y metadatos. |
| `tests/Feature/NewsletterSubscriptionTest.php` | Alta, duplicados y validación. |
| `tests/Feature/Auth/AuthenticationTest.php` | Login por portal, admin, 2FA, logout y throttling. |
| `tests/Feature/AdminPortalTest.php` | Acceso y visibilidad de módulos por rol. |
| `tests/Feature/AdminCareerTest.php` | CRUD de carreras: permisos, validación, alta, edición y baja. |
| `tests/Feature/AdminSubjectTest.php` | CRUD de materias: permisos, validación, búsqueda y baja. |
| `tests/Feature/AcademicSeederTest.php` | Solo las 4 carreras oficiales y renombrado de códigos históricos. |
| `tests/Feature/AdmissionApplicationTest.php` | Ventana, registro, validaciones, consulta, enlaces firmados y documentos. |
| `tests/Feature/AdminAdmissionTest.php` | Permisos, bandeja, transiciones, aprobación, documentos y conversión con credenciales iniciales. |
| `tests/Feature/PasswordDefinitionTest.php` | Login con cédula, bloqueo del portal, definición de contraseña y validación. |
| `tests/Feature/StudentPortalTest.php` | Expediente de admisión en el dashboard, ausencia de datos ficticios y actualización de perfil. |
| `tests/Feature/ProfessorGradeTest.php` | Carga de notas, validación y redondeo. |
| `tests/Feature/DashboardTest.php` | Redirecciones por rol. |
| `tests/Feature/Settings/*` | Perfil, contraseña y seguridad. |

**Resultado actual:** 163 pruebas aprobadas, 887 aserciones.
