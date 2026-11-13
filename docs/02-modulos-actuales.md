# 02 · Módulos actuales y funcionalidades

Este documento describe lo que la aplicación **ya hace** al 2 de noviembre de 2026.

## 1. Sitio público (landing)

**Ruta:** `GET /` · **Nombre:** `landing`
**Controlador:** `App\Http\Controllers\LandingController`
**Página:** `resources/js/pages/landing/index.tsx`

### Secciones implementadas

| Sección             | Componente        | Funcionalidad                                                                                                                                                                              |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Barra de navegación | `navbar.tsx`      | Sticky, enlaces ancla a secciones, menú móvil, botón de acceso que navega a `/login`.                                                                                                      |
| Hero                | `hero-slider.tsx` | 5 diapositivas (institucional, noticia, congreso, preinscripción, portal), autoplay de 7 s con pausa al pasar el cursor o al ocultar la pestaña, flechas, puntos y navegación por teclado. |
| Cifras              | `stats-band.tsx`  | Contadores animados con `IntersectionObserver`.                                                                                                                                            |
| Nosotros            | `about.tsx`       | Historia institucional y sellos oficiales UPEL / IMPM en SVG.                                                                                                                              |
| Carreras            | `careers.tsx`     | Carreras activas con ofertas vigentes, filtros por modalidad calculados desde la base de datos y página de detalle con su pensum.                                                          |
| Modalidad online    | `online-mode.tsx` | Bloque oscuro con 4 tarjetas de vidrio.                                                                                                                                                    |
| Cursos              | `courses.tsx`     | 6 cursos y talleres con precio, duración y modalidad.                                                                                                                                      |
| Profesores          | `teachers.tsx`    | Carrusel de 12 docentes con especialidad y avatar.                                                                                                                                         |
| Noticias            | `news.tsx`        | 6 noticias con arte generado.                                                                                                                                                              |
| Graduaciones        | `graduations.tsx` | Cuenta regresiva a la meta de graduación.                                                                                                                                                  |
| Llamado final       | `cta.tsx`         | CTA con estado dinámico según las fechas de inscripción.                                                                                                                                   |
| Pie de página       | `footer.tsx`      | Enlaces, contacto, sellos y acceso a login.                                                                                                                                                |

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
- Validación en `StoreAdmissionRequest`: edad mínima de 15 años; cédula no registrada en
  ninguna convocatoria previa; correo no asociado a cuentas, correos personales de
  estudiantes ni solicitudes de ninguna convocatoria; aceptación de las condiciones y
  oferta académica activa. La cédula y el correo se verifican en el primer paso al salir
  de cada campo y de nuevo al continuar; los duplicados muestran el error junto al campo
  correspondiente y bloquean el avance.
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
  paginación y tarjetas de resumen. Las solicitudes convertidas ya no se muestran aquí.
- `/admin/admissions/{code}`: expediente completo, descarga de archivos, apertura del
  documento en una pestaña nueva (PDF/JPG/PNG servidos inline), validación de documentos y
  cambio de estado. Una solicitud convertida redirige al perfil estudiantil.
- El administrador puede editar o eliminar solicitudes no convertidas; los permisos
  `admissions.edit` y `admissions.delete` son exclusivos del rol administrador.
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
  documentos y convertir aspirantes. `admissions.edit` y `admissions.delete` habilitan la
  edición y eliminación de solicitudes únicamente al administrador.

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

| `portal` enviado | Roles aceptados                                                       |
| ---------------- | --------------------------------------------------------------------- |
| `estudiante`     | `estudiante`                                                          |
| `profesor`       | `profesor`                                                            |
| `graduado`       | `graduado`                                                            |
| `admin`          | `admin`, `decano`, `coordinador_academico`, `personal_administrativo` |

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

| Pestaña             | Componente                      | Funcionalidad                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inicio              | `modules/Inicio.tsx`            | Saludo, resumen de promedio, materias, créditos, avance, franja de la solicitud de admisión y accesos rápidos.                                                                                                                                                                                                     |
| Mi solicitud        | `modules/MiSolicitud.tsx`       | Expediente de admisión completo: datos personales y académicos, récord de bachillerato, documentos, historial y observaciones.                                                                                                                                                                                     |
| Mis materias        | `modules/MisMaterias.tsx`       | Inscripciones con período, profesor, créditos y estado.                                                                                                                                                                                                                                                            |
| Mis calificaciones  | `modules/MisCalificaciones.tsx` | Cortes N1/N2/N3, nota final y estado por materia.                                                                                                                                                                                                                                                                  |
| Mis profesores      | `modules/MisProfesores.tsx`     | Docentes de las materias inscritas con departamento y materias.                                                                                                                                                                                                                                                    |
| Mi carrera y pénsum | `modules/MiCarreraPensum.tsx`   | Mapa curricular por período con estado aprobado/cursando/pendiente y marca de libre elección (UNCLE).                                                                                                                                                                                                              |
| Mi horario          | `modules/MiHorario.tsx`         | Horario oficial (plantilla de 16 sábados o rango dinámico publicado), seleccionado por carrera, período, modalidad y horario de preinscripción; incluye las dos cuadrículas, descarga/impresión en PDF (`GET /estudiante/horario/pdf`) y avisos en la campana al publicar o actualizar el horario correspondiente. |
| Mi perfil           | `modules/MiPerfil.tsx`          | Datos reales del aspirante (cédula, nacimiento, período, turno) y formulario de actualización (`PUT /estudiante/perfil`).                                                                                                                                                                                          |
| Mis trámites        | `modules/MisTramites.tsx`       | Solicitud de constancias y solvencias (`POST /estudiante/tramites`).                                                                                                                                                                                                                                               |

- `Student\DashboardController` envía `admission` con la solicitud que originó la cuenta
  (datos, documentos e historial) y completa el perfil con esos datos cuando el
  `student_profile` no los tiene; ya no inventa valores personales.

- `App\Support\StudentSchedule` transcribe el horario oficial de Educación Primaria
  período 1 y lo filtra por el horario de estudio del estudiante; los horarios publicados
  se seleccionan por carrera, período, modalidad y horario de estudio. Al publicarlos o
  actualizarlos, los estudiantes activos que coinciden reciben una notificación en la
  aplicación. Los horarios con rango de fechas se generan con `ScheduleCalendar`
  (columnas por sábado o por semana) y conservan las fechas y horas exactas de cada
  materia. `MiHorario` lo muestra completo y `App\Support\StudentSchedulePdf` genera el
  PDF oficial para imprimir o descargar (sin dependencias externas).

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

| Módulo       | Permiso           | Contenido                                                                                                    |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `admissions` | `admissions.view` | Bandeja de preinscripciones, expediente, documentos y conversión (páginas propias).                          |
| `students`   | `students.view`   | Listado de expedientes, carrera, semestre, estado y promedio; acciones de perfil solo para el administrador. |
| `professors` | `professors.view` | Perfiles docentes, departamento, título y materias asignadas; gestión según permiso.                         |
| `careers`    | `careers.view`    | Oferta académica, modalidad, duración, materias y estudiantes.                                               |
| `subjects`   | `subjects.view`   | Unidades curriculares, créditos, docentes e inscritos.                                                       |
| `pensums`    | `subjects.view`   | Pensums por carrera, materias agrupadas por período y acceso para agregar materias con `subjects.manage`.    |
| `schedules`  | `schedules.view`  | Horarios oficiales por carrera, período y cohorte, con vista previa y PDF.                                   |
| `grades`     | `grades.view`     | Calificaciones globales, promedio, aprobadas y sin nota.                                                     |
| `finance`    | `finance.view`    | Recaudado, por cobrar, vencidos y detalle de pagos.                                                          |
| `programs`   | `programs.view`   | Postgrados, cursos y talleres.                                                                               |
| `users`      | `users.view`      | Cuentas, roles, verificación y fecha de registro.                                                            |
| `roles`      | `roles.manage`    | Roles, permisos, usuarios y alcance.                                                                         |

### Visibilidad por rol

| Rol                     | Módulos visibles      |
| ----------------------- | --------------------- |
| Administrador           | Todos                 |
| Decano                  | Académicos + finanzas |
| Coordinador académico   | Académicos            |
| Personal administrativo | Finanzas              |

- `AdminDashboardController` construye las tarjetas a partir del catálogo y de los
  permisos del usuario.
- El panel incluye el resumen del pensum por carrera. Desde allí se puede consultar el
  detalle y, con `subjects.manage`, agregar materias directamente a la carrera seleccionada.
- Los usuarios con `students.view` pueden consultar el listado. Solo el administrador puede
  ver perfiles, editar datos personales/académicos y eliminar cuentas; la eliminación
  permanente borra perfil, inscripciones y pagos, conservando la solicitud de admisión como
  registro histórico.
- `AdminAdmissionController` implementa el flujo de admisiones con escritura (estados,
  revisión de documentos y conversión); carreras, materias, profesores y horarios tienen
  sus propios flujos de gestión. Los programas y usuarios siguen en solo lectura.
- `AdminProfessorController` permite registrar cuentas con rol Profesor y contraseña
  temporal de cambio obligatorio, editar datos del perfil, consultar el perfil docente y
  sincronizar las materias asignadas. La selección usa el catálogo de materias de carreras
  existente, agrupado en acordeones por carrera y, dentro de cada carrera, por período (I,
  II, III…), de modo que se pueden elegir materias de distintos períodos para el mismo
  profesor; desde el formulario se puede abrir el CRUD de materias.
    - **Rutas:** `/admin/professors` (`admin.professors.index`), `/create`,
      `/{professor}/edit`, `GET /{professor}` (perfil) y `DELETE /{professor}`.
    - **Páginas:** `resources/js/pages/admin/professors/index.tsx`, `form.tsx` y `show.tsx`.
    - El listado muestra las acciones **Ver**, **Editar** y **Eliminar** según permisos.
      Eliminar borra la cuenta, su perfil docente, sus materias asignadas y sus
      notificaciones; los horarios publicados conservan el registro sin docente asignado.
      Requiere `professors.delete`, exclusivo del administrador, y no permite borrar cuentas
      con rol administrador.
    - `AdminScheduleController` ofrece en cada materia únicamente los profesores con perfil
      registrado y vínculo en `professor_subjects`.
- `AdminModuleController` valida permiso antes de responder y devuelve `403` si falta.
- La tabla se renderiza con `resources/js/pages/admin/resource.tsx` (columnas, filas,
  tonos y estadísticas).

### Horarios publicados

**Rutas:** `/admin/schedules` (`admin.schedules.index`), `/create`, `/{schedule}`,
`/{schedule}/edit`, `/{schedule}/pdf` y `DELETE /{schedule}`
**Controlador:** `App\Http\Controllers\AdminScheduleController`
**Páginas:** `resources/js/pages/admin/schedules/index.tsx`, `form.tsx`, `show.tsx`

- Tabla `schedules`: `career_id`, `period` (1–12), `cohort` (`2025-II`), `study_schedule`
  (`sabatino` o `lunes_viernes`), `modality` (`presencial`, `mixta` u `online`), `starts_on`
  y `ends_on`, con índice único por carrera + período + cohorte + tipo de horario +
  modalidad.
- Tabla `schedule_subjects`: `schedule_id`, `subject_id`, `professor_id` opcional,
  `teacher_name` opcional, `position` (1–7), `dates` (JSON con los días exactos de clase),
  `date_times` (JSON con la hora de inicio y fin de cada fecha), `starts_at` y `ends_at`
  como respaldo, con unicidad por horario + posición y horario + materia.
- El formulario elige la carrera con un `select` de las carreras activas, muestra los
  períodos según su `duration_semesters` (I, II, III…), pide la cohorte manualmente con
  el formato `AAAA-I` o `AAAA-II` y deja elegir el tipo de horario.
- El tipo de horario y la modalidad se cargan de las **ofertas activas** de la carrera
  (`career_offerings`): si una carrera solo ofrece Sabatino, el selector no muestra Lunes a
  viernes; al elegir un tipo de horario, el selector de modalidad solo lista las
  modalidades activas para esa combinación (Presencial, Semipresencial u Online). Si la
  carrera no tiene ofertas activas, no se puede publicar un horario.
- El formulario también permite **editar** un horario publicado, conservando sus materias,
  fechas y horas, y la acción de eliminar sigue disponible desde el listado y la vista.
- El rango de clases se define con fecha de inicio y fecha de finalización. A partir de
  esas fechas, `App\Support\ScheduleCalendar` genera:
    - **Sabatino:** una columna por cada sábado del rango.
    - **Lunes a viernes:** una columna por semana ISO; dentro de cada celda se muestran los
      días seleccionados de esa semana y la hora de la materia.
    - Los meses intermedios y la cantidad de fechas/semanas se resumen junto a los campos.
- Cada fila de **Unidad / Eje Curricular** es un `select` con las materias activas de la
  carrera y el período elegidos. Una materia ya seleccionada desaparece de las demás filas
  y el código (`EDPRI-002`, `EDPRI-007`, …) se completa automáticamente.
- Cada materia elegida marca sus fechas exactas en un calendario de chips agrupado por
  mes, con acciones para seleccionar todas o limpiar. Al marcar una fecha aparecen sus
  propios campos de **hora de inicio y hora de fin**, de modo que una misma materia puede
  tener horarios distintos según el día; solo las fechas marcadas se muestran en la vista
  previa y en el horario publicado. Cambiar el rango o el tipo de horario limpia las fechas
  y horas marcadas para evitar valores fuera de rango.
- La vista previa arranca vacía y solo muestra las materias seleccionadas; no reutiliza
  los datos de la plantilla oficial como contenido de ejemplo.
- Junto a cada materia hay un `select` con los profesores que tienen perfil registrado y
  están asignados a esa materia (`professor_subjects`); al elegir la materia se preselecciona
  el primero. Si no hay perfiles asignados, el selector lo indica y no ofrece docentes de la
  plantilla como si fueran cuentas del sistema. Los nombres históricos guardados en
  `teacher_name` se conservan al editar horarios existentes.
- Las materias con modalidad `online` se publican como **Virtual** únicamente en sus
  fechas seleccionadas, en ambas cuadrículas. Las materias presenciales o mixtas muestran
  su hora solo en las fechas marcadas y nunca heredan el texto `Virtual`.
- La vista previa y el horario publicado conservan el formato oficial (meses, números de
  semana, fechas, dos cuadrículas y leyenda de franjas). `pdf_hours` genera etiquetas
  compactas (`8-12`, `LM 8-12`, `L-V 8-12`) para que las celdas del PDF no se desborden;
  `StudentSchedulePdf` reduce el tamaño de fuente cuando la etiqueta no cabe.
- `ScheduleRequest` valida el tipo de horario y la modalidad contra la oferta activa de la
  carrera, el rango de fechas, que el fin sea posterior al inicio, que cada fecha pertenezca
  al rango y al tipo de horario, que cada fecha tenga hora de inicio y fin con formato
  `HH:MM` y que el fin sea posterior al inicio; además conserva las validaciones de cohorte,
  período, materias, posiciones y que el profesor tenga perfil y esté asignado.
- Los horarios publicados antes de este módulo (sin `starts_on`, `ends_on` ni fechas por
  materia) siguen mostrando las 16 semanas de la plantilla oficial como respaldo.
- `App\Support\StudentSchedule::forStudent()` prioriza el horario publicado por la
  administración para la carrera y el período del estudiante; si no existe, usa el
  catálogo transcrito como respaldo.

## 8. Configuración de cuenta

**Rutas:** `routes/settings.php`

| Página     | Ruta                   | Funcionalidad                                         |
| ---------- | ---------------------- | ----------------------------------------------------- |
| Perfil     | `/settings/profile`    | Nombre, correo, verificación y eliminación de cuenta. |
| Seguridad  | `/settings/security`   | Contraseña, autenticación de dos factores y passkeys. |
| Apariencia | `/settings/appearance` | Tema claro/oscuro/sistema.                            |

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
- `ScheduleFactory` genera horarios de prueba por carrera, período y cohorte.
- `AdmissionSeeder` agrega solicitudes de admisión de muestra con distintos estados y
  documentos para probar la bandeja administrativa.
- `RolePermissionSeeder` crea los 7 roles y todos los permisos, y limpia la caché de
  Spatie después de crearlos.

## 10. Pruebas automatizadas

| Archivo                                        | Cobertura                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `tests/Feature/LandingPageTest.php`            | Landing, fechas y metadatos.                                                                     |
| `tests/Feature/NewsletterSubscriptionTest.php` | Alta, duplicados y validación.                                                                   |
| `tests/Feature/Auth/AuthenticationTest.php`    | Login por portal, admin, 2FA, logout y throttling.                                               |
| `tests/Feature/AdminPortalTest.php`            | Acceso y visibilidad de módulos por rol.                                                         |
| `tests/Feature/AdminCareerTest.php`            | CRUD de carreras: permisos, validación, alta, edición y baja.                                    |
| `tests/Feature/AdminSubjectTest.php`           | CRUD de materias: permisos, validación, búsqueda y baja.                                         |
| `tests/Feature/AdminProfessorTest.php`         | Cuentas docentes, permisos, asignaciones de materias y opciones en horarios.                     |
| `tests/Feature/AdminScheduleTest.php`          | Horarios: permisos, filtros, alta con materias, validación, PDF, baja y prioridad en el portal.  |
| `tests/Feature/AcademicSeederTest.php`         | Solo las 4 carreras oficiales y renombrado de códigos históricos.                                |
| `tests/Feature/AdmissionApplicationTest.php`   | Ventana, registro, validaciones, consulta, enlaces firmados y documentos.                        |
| `tests/Feature/AdminAdmissionTest.php`         | Permisos, bandeja, transiciones, aprobación, documentos y conversión con credenciales iniciales. |
| `tests/Feature/PasswordDefinitionTest.php`     | Login con cédula, bloqueo del portal, definición de contraseña y validación.                     |
| `tests/Feature/StudentPortalTest.php`          | Expediente de admisión en el dashboard, ausencia de datos ficticios y actualización de perfil.   |
| `tests/Feature/ProfessorGradeTest.php`         | Carga de notas, validación y redondeo.                                                           |
| `tests/Feature/DashboardTest.php`              | Redirecciones por rol.                                                                           |
| `tests/Feature/Settings/*`                     | Perfil, contraseña y seguridad.                                                                  |

**Resultado actual:** 163 pruebas aprobadas, 887 aserciones.
