# 02 · Módulos actuales y funcionalidades

Este documento describe lo que la aplicación **ya hace** al 19 de noviembre de 2026.

## 1. Sitio público (landing)

**Ruta:** `GET /` · **Nombre:** `landing`
**Controlador:** `App\Http\Controllers\LandingController`
**Página:** `resources/js/pages/landing/index.tsx`

### Secciones implementadas

| Sección             | Componente        | Funcionalidad                                                                                                                                                                                       |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Barra de navegación | `navbar.tsx`      | Sticky, enlaces ancla a secciones, menú móvil, botón de acceso que navega a `/login`.                                                                                                               |
| Hero                | `hero-slider.tsx` | Diapositivas con imagen subida o una cuenta regresiva con fecha configurable, autoplay de 7 s con pausa al pasar el cursor o al ocultar la pestaña, flechas, puntos y navegación por teclado. |
| Cifras              | `stats-band.tsx`  | Contadores animados con `IntersectionObserver`.                                                                                                                                                     |
| Nosotros            | `about.tsx`       | Historia institucional y sellos oficiales UPEL / IMPM en SVG.                                                                                                                                       |
| Carreras            | `careers.tsx`     | Carreras activas con ofertas vigentes, filtros por modalidad calculados desde la base de datos y página de detalle con su pensum.                                                                   |
| Modalidad online    | `online-mode.tsx` | Bloque oscuro con 4 tarjetas de vidrio.                                                                                                                                                             |
| Cursos              | `courses.tsx`     | 6 cursos y talleres con precio, duración y modalidad.                                                                                                                                               |
| Profesores          | `teachers.tsx`    | Carrusel de los docentes registrados en la base de datos con cargo, reseña y foto tipo carnet (o iniciales si no hay foto).                                                                         |
| Noticias            | `news.tsx`        | 6 noticias con arte generado.                                                                                                                                                                       |
| Graduaciones        | `graduations.tsx` | Cuenta regresiva a la meta de graduación.                                                                                                                                                           |
| Llamado final       | `cta.tsx`         | CTA con estado dinámico según las fechas de inscripción.                                                                                                                                            |
| Pie de página       | `footer.tsx`      | Enlaces, contacto, sellos, acceso a login y crédito “Creado con ❤️ por Kleider Rosamilia” con enlace a GitHub.                                                                                      |

### Comportamiento por fechas

- La ventana de preinscripción se administra desde `/admin/dashboard` (administrador y
  decano): fechas de inicio y cierre y modo **Automático / Abiertas / Cerradas**.
- Antes de la fecha de inicio el botón de preinscripción se muestra deshabilitado con
  cuenta regresiva; dentro del rango se habilita el formulario.
- Al terminar la fecha de cierre las inscripciones se deshabilitan automáticamente. Los
  cierres y aperturas manuales del panel tienen prioridad sobre el rango de fechas.
- La inscripción formal (`canEnroll`) sigue dependiendo de
  `enrollment_opens_at` (12 de enero de 2027 a las 8:00, GMT-4).

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

- Datos personales (nombres, apellidos, nacionalidad, cédula, nacimiento, género, **estado
  civil**, correo, teléfono y dirección). El estado civil es opcional y se guarda en
  `admissions.marital_status` (`soltero`, `casado`, `divorciado`, `viudo`, `concubino`,
  `otro`); se muestra en la ficha administrativa y en la planilla de inscripción.
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
- La ventana la controla `AdmissionWindow` con el registro único de
  `admission_window_settings` que actualiza el panel administrativo (ver “Ventana de
  inscripciones” en el módulo 7). Antes de la fecha de inicio, al pasar la fecha de cierre o
  con un cierre manual se muestra `admissions/closed`, que explica el motivo del cierre; el
  registro inicial toma las fechas de `config/admissions.php` (`ADMISSIONS_CLOSES_AT`).
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
  `admission_status_histories`. Las cargas, reemplazos y revisiones de documentos también se
  registran allí, de modo que el expediente conserva una línea de tiempo auditable.
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
  documentos y convertir aspirantes. `admissions.review` habilita el cambio de estado y la
  validación de documentos desde la bandeja y desde el perfil del estudiante (asignado a los
  roles administrador y decano). `admissions.edit` y `admissions.delete` habilitan la
  edición y eliminación de solicitudes únicamente al administrador.

> La **matrícula en línea** ya permite seleccionar las materias del siguiente período y
> emitir la planilla de inscripción (ver “Inscripción de materias del siguiente período”
> en el portal del estudiante); el **pago** de la inscripción sigue pendiente.

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

**Rutas:** `GET /dashboard` (inicio) y, bajo el prefijo `/dashboard/estudiante`,
`/solicitud`, `/materias`, `/calificaciones`, `/profesores`, `/pensum`, `/horario`,
`/perfil`, `/tramites`, `/inscripciones` y `/inscripciones/planilla`
· **Nombres:** `dashboard`, `student.solicitud`, `student.materias`,
`student.calificaciones`, `student.profesores`, `student.pensum`, `student.horario`,
`student.perfil`, `student.tramites` y `student.enrollment.{index,store,sheet}`
**Controlador:** `App\Http\Controllers\Student\DashboardController` (módulos del portal) y
`App\Http\Controllers\Student\StudentEnrollmentController` (inscripción de materias)
**Páginas:** `resources/js/pages/student/{dashboard,solicitud,materias,calificaciones,
profesores,pensum,horario,perfil,tramites,inscripciones}/index.tsx`

Cada elemento de la barra lateral es una **página independiente** con su propia URL de
Inertia. El controlador expone una acción por sección (`index`, `solicitud`, `materias`,
`calificaciones`, `profesores`, `pensum`, `horario`, `perfil`, `tramites`) que reutiliza el
mismo payload a través de `renderPage()` y de `pageData()`. La navegación de `Sidebar`,
`Topbar` e `Inicio` usa `<Link>` sobre `studentTabHrefs`, construido con las rutas tipadas
de Wayfinder (`@/routes` para `/dashboard` y `@/routes/student` para los módulos). Las
definiciones viven en `routes/estudiantes.php`, cargado bajo `prefix('dashboard')`.

| Página                  | URL                                    | Componente                      | Funcionalidad                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio                  | `/dashboard`                           | `modules/Inicio.tsx`            | Saludo, resumen de promedio (sobre 10), materias con su condición y definitiva reales, créditos, avance, franja de la solicitud de admisión, actividad reciente tomada de la base de datos y próximas evaluaciones del plan, con accesos rápidos a las demás páginas.                                                                                                                          |
| Mi solicitud            | `/dashboard/estudiante/solicitud`      | `modules/MiSolicitud.tsx`       | Expediente de admisión completo: datos personales y académicos, récord de bachillerato, documentos, historial y observaciones.                                                                                                                                                                                                                                                                 |
| Inscripción de materias | `/dashboard/estudiante/inscripciones`  | `modules/MisInscripciones.tsx`  | Selección de materias del siguiente período según las UC asignadas: las aplazadas quedan bloqueadas, el resto se marca o desmarca y al guardar se muestra la planilla oficial **Planilla de Asesoría Académica e Inscripción (Diseño 2015)** con vista previa y PDF (solo activa con la ventana de inscripciones abierta; a la tercera reprobación de una materia se suspende la inscripción). |
| Mis materias            | `/dashboard/estudiante/materias`       | `modules/MisMaterias.tsx`       | Materias del horario publicado (cruzadas con la inscripción cuando existe) con período, créditos, modalidad, estado y el docente asignado enlazado a su perfil (`GET /dashboard/estudiante/profesores/{professor}`).                                                                                                                                                                           |
| Mis calificaciones      | `/dashboard/estudiante/calificaciones` | `modules/MisCalificaciones.tsx` | Acordeones por período académico y materia: cada materia indica las evaluaciones calificadas, la definitiva sobre 10 y la condición; al expandirla lista las evaluaciones del plan del docente con fecha, ponderación, nota sobre 20 y aporte sobre 10.                                                                                                                                        |
| Mis profesores          | `/dashboard/estudiante/profesores`     | `modules/MisProfesores.tsx`     | Tarjetas de los docentes del horario con el mismo formato de la portada (avatar con iniciales, título abreviado, departamento y materias), agrupadas por período académico y con enlace al correo y al perfil del docente.                                                                                                                                                                     |
| Mi carrera y pénsum     | `/dashboard/estudiante/pensum`         | `modules/MiCarreraPensum.tsx`   | Mapa curricular por período con estado aprobado/reprobado/cursando/pendiente —tomado de las notas que carga el docente— y marca de libre elección (UNCLE). Los bloques UNCLE sin asignar muestran su etiqueta genérica; cuando la materia ofertada aparece en el horario del estudiante, el bloque muestra el nombre y el código reales.                                                       |
| Mi horario              | `/dashboard/estudiante/horario`        | `modules/MiHorario.tsx`         | Horario oficial (plantilla de 16 sábados o rango dinámico publicado), seleccionado por carrera, período, modalidad y horario de preinscripción; incluye las dos cuadrículas, descarga/impresión en PDF (`GET /estudiante/horario/pdf`) y avisos en la campana al publicar o actualizar el horario correspondiente.                                                                             |
| Mi perfil               | `/dashboard/estudiante/perfil`         | `modules/MiPerfil.tsx`          | Expediente completo del estudiante (identidad, contacto, datos académicos y de preinscripción, bachillerato), historial de cambios y revisiones, aviso de privacidad, formulario de actualización de contacto y lugar de nacimiento (`PUT /dashboard/estudiante/perfil`) y recarga de documentos con estado de revisión (`POST /dashboard/estudiante/documentos`).                             |
| Mis trámites            | `/dashboard/estudiante/tramites`       | `modules/MisTramites.tsx`       | Solicitud de constancias y solvencias (`POST /estudiante/tramites`).                                                                                                                                                                                                                                                                                                                           |

- `Student\DashboardController` envía `admission` con la solicitud que originó la cuenta
  (datos, documentos e historial) y completa el perfil con esos datos cuando el
  `student_profile` no los tiene; ya no inventa valores personales.
- **Historial de la solicitud:** `App\Support\AdmissionTimeline` estructura las entradas de
  `admission_status_histories` para las vistas Inertia (bandeja de admisiones, perfil
  administrativo del estudiante, portal estudiantil y consulta pública) y presenta como
  revisión documental las entradas sin cambio de estado. Las páginas **Mi solicitud** y
  **Mi perfil** muestran la línea de tiempo con fecha, autor, nota y el resultado de
  validación o rechazo de los archivos; cada carga o reemplazo desde
  `POST /estudiante/documentos` agrega una entrada nueva.

- **Privacidad del perfil estudiantil:** `App\Support\StudentProfilePrivacy` separa la
  información pública (nombre, fotografía, carrera, período de ingreso, semestre actual,
  turno y promedio general) de la privada (identidad, contacto, bachillerato, estado de la
  solicitud y documentos). El permiso `students.private.view` controla el acceso a la parte
  privada y viene asignado por defecto a los roles administrador y decano. La fotografía
  tipo carnet se sirve desde `GET /admin/students/{student_code}/foto` (nombre
  `admin.students.photo`) para quien tenga `students.view`.
- **Recarga de documentos:** `POST /estudiante/documentos` (`student.documents.store`)
  reemplaza el archivo del tipo indicado y lo deja en `pendiente`, borrando notas y datos de
  revisión; además marca `review_requested_at`, que alimenta las solicitudes de revisión del
  portal administrativo. `GET /estudiante/documentos/{document}` y `.../descargar` sirven solo
  archivos del propio expediente. El estudiante también descarga sus documentos con el mismo
  control de propiedad.

- `App\Support\StudentSchedule` transcribe el horario oficial de Educación Primaria
  período 1 y lo filtra por el horario de estudio del estudiante; los horarios publicados
  se seleccionan por carrera, período, modalidad y horario de estudio. Al publicarlos o
  actualizarlos, los estudiantes activos que coinciden reciben una notificación en la
  aplicación. Los horarios con rango de fechas se generan con `ScheduleCalendar`
  (columnas por sábado o por semana) y conservan las fechas y horas exactas de cada
  materia. `MiHorario` lo muestra completo y `App\Support\StudentSchedulePdf` genera el
  PDF oficial para imprimir o descargar (sin dependencias externas).

- **Materias y docentes del período:** `Student\DashboardController` arma el prop `subjects`
  con las materias del horario publicado (`Schedule::toScheduleArray()` agrega `professor_id`
  desde el pivote `schedule_subjects`, y recurre al nombre del profesor cuando el horario solo
  guarda `teacher_name`) y las cruza con las inscripciones del estudiante para tomar notas y
  estado; las inscripciones que no figuran en el horario se agregan al final. Cada entrada
  incluye `professor`, `professor_id` y `professor_url`.
  `GET /estudiante/profesores/{professor}` (`student.professors.show`,
  `Student\StudentProfessorController`, página `student/professor/show.tsx`) muestra el perfil
  del docente —departamento, título, código de empleado y correo institucional— con las
  materias que los horarios publicados le asignan (`ProfessorAssignments::subjects()`);
  responde 404 para usuarios sin perfil de profesor y 403
  fuera del rol estudiante. El enlace «Volver a mis materias» regresa a `/dashboard/estudiante/materias`.
- **Docentes por período:** el prop `teachers` se deriva de esas mismas materias, con una
  entrada por docente y período académico (`department`, `academic_title`, `subjects`,
  `semesters`, `period` y `profile_url`). El período de las materias del horario es el
  `cohort` del horario publicado —el mismo que titula la pestaña «Mi horario»— y cae al
  período activo cuando no hay cohorte; las materias inscritas usan el período de su
  inscripción. `MisProfesores.tsx` dibuja cada grupo con tarjetas equivalentes a las de la
  portada: avatar con iniciales, nombre con el título abreviado (Dra., Dr., Mgtr., Esp.,
  Lcda., Lcdo.), departamento en dorado, semestre, descripción con el título completo y
  las materias, y accesos al correo y al perfil del docente.
- **Calificaciones por evaluación:** `App\Support\StudentGrades` toma el plan de evaluación del
  docente (`evaluation_plans`, `evaluation_plan_items` y `evaluation_plan_scores`) de cada
  materia inscrita y lista cada evaluación con su fecha, ponderación, nota sobre 20 y aporte
  sobre 10. La **definitiva** de la materia es la suma de los aportes
  (`EvaluationPlanGrading::accumulatedTen`), igual que en la planilla del docente, y solo
  alcanza la escala completa cuando el plan está al 100 % con todas las evaluaciones
  calificadas. La condición se resuelve con lo que carga el docente: **Aprobado**
  (definitiva ≥ 6), **Reprobado** (definitiva < 6), **Faltan notas**, **Plan incompleto** y
  **Cursando** (sin plan o sin notas); los estados oficiales de la inscripción
  (`aprobado`, `reprobado`, `retirado`) tienen prioridad cuando existen.
  `MisCalificaciones.tsx` agrupa por período académico (`enrollments[].period`) en
  acordeones: período → materia (“x de y evaluaciones calificadas”, definitiva y condición)
  → detalle de evaluaciones cargadas por el docente. El resumen del portal
  (`summary.average`, `approved_count`, `pending_count`) y el pénsum
  (`pensum[].subjects[].status/grade`) usan esa misma definitiva, por lo que la materia
  aparece **Aprobada** o **Reprobada** en cuanto el docente completa las notas.
- **Actividad y próximas evaluaciones:** `recent_activity` se arma con datos reales —notas
  publicadas desde `evaluation_plan_scores`, notificaciones de horario publicado y
  `admission_status_histories`—, ordenados por fecha y con hora relativa en español;
  `upcoming_evaluations` lista las evaluaciones del plan sin nota con fecha futura. `Inicio`
  ya no muestra textos de ejemplo.
- `resources/js/app.tsx` resuelve el layout de las páginas `student/*` como `null`: cada
  página monta su propio `StudentLayout`, sin el layout de aplicación alrededor.
- La barra lateral (`components/student/Sidebar.tsx`) agrupa “Mi vida académica” y
  “Cuenta y Servicios”, enlaza cada sección con su URL y incluye cierre de sesión.
- La barra superior (`components/student/Topbar.tsx`) muestra el título del módulo y el
  usuario autenticado, con acceso al perfil.
- `StudentLayout` incorpora `FlashMessages` para los avisos de éxito.

> Existe además un dashboard anterior en `resources/js/pages/dashboard/student.tsx`
> que ya no se utiliza para estudiantes (ver correcciones pendientes).

### Inscripción de materias del siguiente período

**Rutas:** `GET /dashboard/estudiante/inscripciones` (`student.enrollment.index`),
`POST /dashboard/estudiante/inscripciones` (`student.enrollment.store`) y
`GET /dashboard/estudiante/inscripciones/planilla` (`student.enrollment.sheet`)
**Controlador:** `App\Http\Controllers\Student\StudentEnrollmentController`
**Petición:** `App\Http\Requests\StudentEnrollmentRequest`
**Soporte:** `App\Support\StudentEnrollment` (reglas y selección) y
`App\Support\StudentEnrollmentSheetPdf` (planilla)
**Página:** `resources/js/pages/student/inscripciones/index.tsx` con
`resources/js/components/student/modules/MisInscripciones.tsx`
**Prop compartida:** `studentEnrollment` (`HandleInertiaRequests`) con `is_open`,
`submitted`, `url`, `opens_at`, `closes_at` y `reason`

- El apartado **solo se activa con la ventana de inscripciones abierta**
  (`AdmissionWindow::isOpen()`, la misma que administra el panel administrativo). El enlace
  aparece en la barra lateral y la tarjeta del Inicio mientras la ventana está abierta y
  permanece visible después si el estudiante ya tiene una inscripción registrada en el
  período vigente, para que pueda consultar su planilla.
- **Período destino:** el período activo mientras el estudiante no tenga matrículas en
  períodos posteriores; si ya cursó el activo, el siguiente período por fecha de inicio.
- **UC asignadas:** suma de los créditos de las materias del pénsum base del semestre que
  corresponde inscribir. El semestre se toma del perfil cuando no hay historial y, en caso
  contrario, del semestre siguiente al último cursado; una vez registradas las materias del
  período se conserva el semestre inscrito.
- **Materias aplazadas:** toda materia con condición **Reprobado** (definitiva del plan
  menor a 6) sin aprobación posterior en otro período consume primero las UC asignadas,
  aparece marcada y con candado: el estudiante no puede desmarcarla y el backend rechaza
  cualquier selección que la omita.
- **Resto de las UC:** se reparten entre las materias del semestre siguiente que el
  estudiante no haya aprobado, en orden de pénsum. La selección inicial es codiciosa: se
  marcan todas las materias que caben en las UC disponibles y el estudiante puede marcar o
  desmarcar las demás mientras la ventana siga abierta; el servidor no acepta selecciones
  que superen las UC asignadas.
- **Repitencia y suspensión:** cada reprobación queda registrada como una inscripción del
  período en que se cursó. En **Mis Materias** la materia muestra la etiqueta
  `Reprobada 2.ª vez` y la fila **Veces reprobada**; a la **tercera** reprobación el
  estudiante queda suspendido de las inscripciones: la página de inscripción reemplaza la
  selección por el aviso «Has reprobado la o las materias: … Debes dirigirte a control de
  estudios.» y `StudentEnrollment::save()` rechaza cualquier intento con el mismo mensaje.
- **Persistencia:** `POST /dashboard/estudiante/inscripciones` guarda (o actualiza) las
  inscripciones del período con estado `cursando` y el docente tomado de
  `professor_subjects`; desmarcar elimina la inscripción solo si sigue en `cursando` y no
  tiene notas de evaluación. La validación vuelve a comprobar la ventana, las materias
  permitidas y el tope de UC.
- **Correcciones de última hora:** cada petición recalcula la condición de las materias con
  `StudentGrades::breakdown()`. Si el docente corrige una nota y la materia queda aprobada,
  desaparece automáticamente de **Materias a cursar** y de la **Planilla de Asesoría
  Académica e Inscripción**; su inscripción se conserva solo como historial y sus UC dejan
  de contar en el período. La selección y el total de la planilla se recalculan con las
  materias vigentes, y el servidor sigue rechazando cualquier selección que supere el tope
  de UC o incluya una materia ya aprobada.
- **Planilla de inscripción:** con la inscripción registrada, la página muestra y el PDF
  reproduce la **Planilla de Asesoría Académica e Inscripción – Diseño 2015** de la UPEL-IMPM
  (carta 612 × 792): cabecera con los logotipos y las cuatro líneas institucionales, **Datos
  Básicos** (cédula `V18534451`, período académico —no semestre—, cohorte, especialidad,
  entidad académica `EA La Guaira`, primer y segundo apellido, primer y segundo nombre,
  fecha de nacimiento, estado civil, sexo, teléfono, email y dirección), la tabla **PA /
  UNIDAD CURRICULAR / COMP / TIPO / CA / INSCRITAS** sin columna de docente, la fila
  **Firma del Estudiante** con **TOTAL CA ASESORADOS E INSCRITOS EN EL PERÍODO**, el bloque
  **Datos de los Funcionarios** (Asesoría e Inscripción) y **Sello**. `GET
  /dashboard/estudiante/inscripciones/planilla` genera el PDF (apertura en línea y `?download=1` para
  descargar) sin dependencias externas.
- La página se prueba con `tests/Feature/StudentEnrollmentTest.php` (página y prop,
  inscripción y PDF con el formato institucional, aplazadas bloqueadas, tope de UC,
  desmarcado, registro de repitencia, suspensión a la tercera reprobación y ventana
  cerrada).

**Cierre:** 16 de noviembre de 2026.

## 5. Portal del profesor

**Rutas:** `GET /dashboard` (resumen, mismo endpoint que graduado; el controlador decide),
`GET /dashboard/profesor/estudiantes`, `GET /dashboard/profesor/cargar-notas` y `GET /dashboard/profesor/mis-carreras`
· **Nombres:** `professor.students`, `professor.grades.index`, `professor.careers`
**Controladores:** `DashboardController::professorDashboard` y `ProfessorWorkspaceController`
**Soporte:** `app/Support/ProfessorWorkspace.php`
**Páginas:** `resources/js/pages/dashboard/professor.tsx` (resumen),
`resources/js/pages/dashboard/professor/{students,grades,careers}.tsx`
**Layout:** `resources/js/layouts/professor-layout.tsx` (registrado en `resources/js/app.tsx`)

- Shell propio del portal docente: barra lateral navy con logo UPEL, rol y navegación por
  páginas independientes (Resumen, Estudiantes, Cargar notas, Mis carreras, Planes de
  evaluación), topbar fija y área de contenido con el mismo ancho máximo y espaciado que los
  portales de estudiante y administrativo.
- **Resumen** (`GET /dashboard`): carreras, materias, estudiantes, notas pendientes, notas
  cargadas y promedio, datos del profesor y accesos rápidos a las demás páginas. Los conteos
  de estudiantes y notas salen del cohorte de cada materia y de las notas cargadas en el plan
  de evaluación, no de la nota final del expediente; el **promedio** solo considera las
  definitivas ya resueltas (**Aprobado** o **Reprobado**), no los acumulados parciales.
- Las carreras, materias y estudiantes salen **solo de los horarios publicados**
  (`app/Support/ProfessorAssignments.php`): el decano elige carrera, materia y docente al
  crear el horario, y de ahí se alimenta el portal. `professor_subjects` queda únicamente
  como banco de materias para el formulario de horarios.
- Si el docente no tiene materias en ningún horario, “Mis carreras” y las páginas de notas
  muestran **Pendiente por asignación** y no listan carreras ni estudiantes.
- Cada materia indica su código, semestre, cohorte, horario (Lunes a viernes / Sabatino) y
  cantidad de estudiantes de su cohorte.
- **Estudiantes** (`GET /dashboard/profesor/estudiantes`): selector de carrera y, por materia, la
  tabla de **nota definitiva del plan de evaluación** (estudiante, código, período, nota y
  estado). La lista es el **cohorte de la materia** —estudiantes activos de su carrera más
  los inscritos, el mismo roster de la planilla de evaluación—, así que al hacer clic en una
  carrera se ven todos sus estudiantes aunque todavía no tengan notas. La nota y el estado
  salen solo de las notas cargadas en el plan (`ProfessorWorkspace::rosterRow()`): la nota es
  la **definitiva acumulada** (suma de los aportes de cada evaluación calificada); con notas
  parciales se muestra ese acumulado y el estado **Faltan notas**; con todas las evaluaciones
  calificadas y el plan al 100 %, la definitiva sobre 10 resuelve **Aprobado** o **Reprobado**;
  si el plan todavía no suma 100 % el estado es **Plan incompleto**; sin
  ninguna nota la columna Nota indica **Sin nota** y el estado **Cursando** (no se reutiliza
  la nota final del expediente). La acción **Cargar nota / Editar nota** (según haya notas
  cargadas) abre la página **Cargar notas**
  con `?materia={subject_id}&estudiante={student_id}` para cargar las notas por evaluación de
  ese estudiante, y la tarjeta **Avance de notas** cuenta las definitivas y los estudiantes
  sin nota. `PUT /dashboard/profesor/notas/{enrollment}` y `UpdateGradeRequest` siguen
  disponibles en el backend, pero el portal ya no abre el modal de nota final.
- **Cargar notas** (`GET /dashboard/profesor/cargar-notas`): selector de carrera compacto —una barra
  horizontal de pastillas (`CareerPicker` con `variant="compact"`) sobre el contenido, para
  no restar ancho a la planilla— y, por materia, la planilla **Notas por estudiante** del plan
  de evaluación, sin la tabla de nota final. Cada
  evaluación tiene su columna con porcentaje y fecha, la definitiva se calcula en vivo **sumando
  los aportes** de las evaluaciones calificadas y debajo de cada nota aparece su **aporte a la
  definitiva sobre 10** —nota ÷ 2 × porcentaje de la evaluación, por ejemplo 18 al 15 % aporta
  1,35— calculado con `weightedContribution()` de `resources/js/lib/evaluation-plan.ts`; las
  celdas sin nota no muestran aporte. El detalle del cálculo está en el `title` de cada aporte
  (nota × porcentaje) y la nota al pie de la tabla.
  **Guardar notas** envía a `PUT /dashboard/profesor/planes-evaluacion/{plan}/notas`. La tabla y su
  estado son compartidos (`components/professor/evaluation-grades-table.tsx` y
  `components/professor/use-evaluation-grades.ts`); los datos llegan de
  `ProfessorWorkspace::overview(..., withGradeSheets: true)` con el roster del plan
  (`EvaluationPlanSheet::studentRows()`). Los parámetros `materia` y `estudiante` resaltan y
  desplazan la vista hasta la fila indicada (prop `highlightStudentId`).
- Cada materia indica el estado de su plan (**Plan 100 %** o **Faltan X %**) y enlaza a
  **Ver plan**; si todavía no tiene plan muestra **Crear plan** con la materia y el cohorte
  preseleccionados.
- **Mis carreras** (`GET /dashboard/profesor/mis-carreras`): tarjetas por carrera con sus materias,
  estado del plan y accesos directos a la planilla de notas y al plan de evaluación.

### Planes de evaluación

**Rutas:** `GET /dashboard/profesor/planes-evaluacion`, `GET /dashboard/profesor/planes-evaluacion/crear`,
`POST /dashboard/profesor/planes-evaluacion`, `GET /dashboard/profesor/planes-evaluacion/{plan}`,
`DELETE /dashboard/profesor/planes-evaluacion/{plan}`,
`POST/PUT/DELETE /dashboard/profesor/planes-evaluacion/{plan}/evaluaciones[/{item}]` y
`PUT /dashboard/profesor/planes-evaluacion/{plan}/notas` · **Nombre:** `professor.plans.*`
**Controladores:** `ProfessorEvaluationPlanController`, `EvaluationPlanItemController`,
`EvaluationPlanScoreController`
**Páginas:** `resources/js/pages/professor/plans/{index,create,show}.tsx`
**Soporte:** `app/Support/EvaluationPlanGrading.php`, `app/Support/EvaluationPlanSheet.php`,
`app/Support/EvaluationPlanDates.php`, `resources/js/lib/evaluation-plan.ts`
**Pruebas:** `tests/Feature/ProfessorEvaluationPlanTest.php`,
`tests/Unit/EvaluationPlanGradingTest.php`

- El listado muestra **todas las materias asignadas al docente según el horario** (no solo
  las que ya tienen plan), con carrera, cohorte, período, ponderación acumulada, evaluaciones
  y estudiantes. Cada fila abre la planilla del plan o, si la materia no tiene plan, el
  formulario de creación con `?subject_id=&schedule_id=` preseleccionados
  (`defaults.subject_id` y `defaults.schedule_id`).
- **Eliminar plan:** el botón de papelera del listado solo aparece mientras el plan tenga
  alguna evaluación por cumplir. Cuando todas las fechas ya pasaron el plan se marca
  **Finalizado** y solo puede eliminarlo quien tenga el permiso `plans.delete` (decano,
  coordinador académico o administrador, o un docente al que se le asigne); el servidor
  rechaza el `DELETE` con flash de error mediante `EvaluationPlan::isFinished()`.
- Creación en cascada: **carrera → cohorte** (horarios publicados de la carrera), luego
  materia y período académico. Solo aparecen las carreras, cohortes y materias que los
  horarios le asignan al docente; si no tiene ninguna, el formulario muestra
  **Pendiente por asignación**. La cabecera de la planilla toma Profesor, Cédula
  (`professor_profiles.identity_document`), Programa (`careers.program_type`: pregrado,
  postgrado, curso o taller), Sede/Extensión (`EvaluationPlanSheet::SEDE`), Especialidad
  (carrera), Curso (`código - nombre`), Período Académico, Horario del cohorte (Lunes a
  viernes / Sabatino) y Ambiente, que se toma siempre de la modalidad registrada en la
  materia (Presencial, Online o Semipresencial) y no se edita en el plan.
- Reglas de ponderación (`EvaluationPlanGrading`): cada evaluación vale entre 5 % y 20 %,
  el plan no puede pasar del 100 %, y solo se permiten materias que el docente imparte
  dentro de la carrera del cohorte. El servidor valida esa impartición con
  `ProfessorAssignments::teachesSubject()`, es decir, contra los horarios publicados. Un
  plan por docente, cohorte, materia y período.
- Nota definitiva: la **suma de los aportes** de las evaluaciones calificadas, sin normalizar
  por el porcentaje faltante (`EvaluationPlanGrading::accumulatedTen()` / `accumulatedTen()` de
  `resources/js/lib/evaluation-plan.ts`). El aporte de cada evaluación es nota ÷ 2 × su
  porcentaje, así que 10 al 15 % aporta 0,75 y 12 al 20 % aporta 1,20; la definitiva de esas
  dos evaluaciones es 1,95 sobre 10 y solo llega a 10 cuando el plan está 100 % calificado.
  **Aprobado** o **Reprobado** solo se resuelve cuando el plan suma 100 % y todas las
  evaluaciones tienen nota; en cualquier otro caso la nota queda **Faltan notas** (o **Plan
  incompleto** si ya están todas las notas pero falta ponderación).
- Las fechas de evaluación se eligen entre los días de clase que el horario del cohorte
  asigna a la materia (`schedule_subjects.dates`, ver `EvaluationPlanDates`); el servidor
  rechaza cualquier otra fecha. Cada día de clase se usa en una sola evaluación: al
  elegir una fecha deja de estar disponible para las demás (`EvaluationPlanDates::isUsed()`),
  tanto al agregar como al editar. Si la materia no tiene días asignados en ese horario, el
  formulario y la planilla muestran **Sin horario asignado** y no permiten programar
  evaluaciones; si ya se usaron todos los días, muestran **Sin fechas disponibles**.
- `fecha de inicio` y `fecha de fin` se recalculan solas desde las fechas de las
  evaluaciones (`EvaluationPlan::syncScheduleWindow()`), también al agregar, editar o
  eliminar una evaluación; al borrar se reordenan las posiciones restantes.
- Una evaluación cuya fecha ya pasó queda **cerrada**: su tarjeta se resalta en ámbar con la
  insignia **Fecha cumplida** y la nota “La fecha ya pasó: la evaluación quedó cerrada y no
  se puede editar”, pierde las acciones **Editar** y **Eliminar** —solo queda **Ver notas**—
  y el servidor rechaza tanto la actualización como la eliminación
  (`PUT`/`DELETE /dashboard/profesor/planes-evaluacion/{plan}/evaluaciones/{item}` → flash de error)
  mediante `EvaluationPlanItem::isPastDue()`. La planilla expone el indicador como
  `items.*.is_past`.
- Cada evaluación tiene la acción **Ver notas**, que abre el diálogo
  `components/professor/evaluation-item-scores-dialog.tsx` con la lista completa de
  estudiantes del cohorte y la nota obtenida en esa evaluación, además del total de
  estudiantes, cuántas notas están cargadas y el promedio de la evaluación. Es solo de
  consulta: las notas se siguen cargando en la página **Cargar notas**.
- Las notas se cargan de 1 a 20 por evaluación desde la página **Cargar notas** del portal
  docente. Cada celda acepta como máximo dos enteros y dos decimales (coma o punto; se
  normaliza a coma con `sanitizeScoreInput` en `resources/js/lib/evaluation-plan.ts`) y
  reajusta a 20 cualquier valor mayor, con un aviso emergente que indica el tope. El backend
  mantiene el rechazo de notas fuera de 1–20 en `EvaluationPlanScoresRequest`. La definitiva
  acumula en vivo los aportes de las evaluaciones calificadas (ver la regla anterior) y se
  muestra en la escala de 1 a 10, donde 6 aprueba. `enrollments.final_grade` no se
  modifica desde este módulo.
- El roster de la planilla (`EvaluationPlanSheet::studentRows()`) reúne a todos los
  estudiantes activos de la carrera del plan más los ya inscritos en la materia, aunque no
  tengan inscripción; se ordenan por nombre. Cada fila muestra el **cohorte actual** (el del
  horario del plan) y, si el estudiante viene de otro cohorte, también su **cohorte propio**
  (el del horario donde cursa sus materias y, si no tiene, su año de ingreso), de modo que
  los rezagados se identifican a simple vista.
- Si el docente califica a un estudiante del cohorte que todavía no tenía inscripción, el
  servidor le crea la inscripción en la materia y período del plan
  (`EvaluationPlanScoreController::createEnrollment()`) con el docente del plan y estado
  `cursando`; las notas se guardan contra esa inscripción. Solo los estudiantes activos de
  la carrera del plan pueden recibir una inscripción nueva.
- La planilla tiene una **vista previa del documento** con el formato oficial de Control de
  Estudios (`EvaluationPlanSheet` + `components/professor/evaluation-plan-sheet.tsx`):
  logotipo UPEL en la cabecera, datos de identificación (profesor, cédula, programa, sede,
  especialidad con su código, curso, período, horario, ambiente, cohorte y fechas), la tabla
  de evaluaciones con fecha y ponderación, y la tabla de notas por estudiante con N°, Sec.,
  Esp., Cohorte (actual y propio), Cédula, nombre, nota por evaluación y nota final. Se abre
  desde **Vista previa** en la planilla y se imprime o guarda como PDF con el navegador; al
  imprimir solo se muestra el documento (`body.evaluation-sheet-print` en
  `resources/css/app.css`). La vista previa usa las notas guardadas del plan.
- El detalle del plan ya **no incluye la planilla de carga**: administra sus evaluaciones,
  muestra el aviso con el enlace a **Cargar notas** y la vista previa del documento.

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

| Módulo       | Permiso           | Contenido                                                                                                                                                                                                   |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admissions` | `admissions.view` | Bandeja de preinscripciones, expediente, documentos y conversión (páginas propias).                                                                                                                         |
| `students`   | `students.view`   | Listado de expedientes, carrera, semestre, estado y promedio; acciones de perfil solo para el administrador.                                                                                                |
| `professors` | `professors.view` | Perfiles docentes, departamento, título y materias asignadas; gestión según permiso.                                                                                                                        |
| `careers`    | `careers.view`    | Oferta académica, modalidad, duración, materias y estudiantes.                                                                                                                                              |
| `subjects`   | `subjects.view`   | Unidades curriculares, créditos, docentes e inscritos.                                                                                                                                                      |
| `pensums`    | `subjects.view`   | Pensums por carrera con vista previa del formato oficial (PA, CA/PA, CÓD, COMP, TIPO, AREA, NIVEL, CA, HAD, HLE, PREL y RE), PDF para ver o descargar y acceso para agregar materias con `subjects.manage`. |
| `schedules`  | `schedules.view`  | Horarios oficiales por carrera, período y cohorte, con vista previa y PDF.                                                                                                                                  |
| `grades`     | `grades.view`     | Calificaciones globales, promedio, aprobadas y sin nota.                                                                                                                                                    |
| `finance`    | `finance.view`    | Recaudado, por cobrar, vencidos y detalle de pagos.                                                                                                                                                         |
| `programs`   | `programs.view`   | Postgrados, cursos y talleres.                                                                                                                                                                              |
| `users`      | `users.view`      | Cuentas, roles, verificación y fecha de registro.                                                                                                                                                           |
| `roles`      | `roles.manage`    | Roles, permisos, usuarios y alcance.                                                                                                                                                                        |

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
- El detalle del pensum muestra una vista previa con el formato de la planilla oficial que se
  actualiza con las materias registradas, además de acciones para ver el PDF en el navegador
  y descargarlo como `pensum-{nombre-de-la-carrera}.pdf`. `PensumPdf` genera el documento con
  los períodos agrupados y los niveles (FUND, INTEG, PROF) en una sola página: reduce el
  cuerpo de la tabla lo necesario para que el pensum completo entre en la hoja. Cada celda se
  centra con los anchos reales de Helvetica y los números romanos de la columna PA se ajustan
  para quedar siempre dentro de su columna.
- Los enlaces de alta y edición de materias que salen del pensum envían `return_to=pensum`;
  al guardar o eliminar, el controlador vuelve al pensum de la carrera (con
  `admin.subjects.index` como destino por defecto) para que la vista previa se refresque.
- Los usuarios con `students.view` pueden consultar el listado y abrir el perfil público.
  Con `students.private.view` ven además la información privada y la carpeta documental. Solo
  el administrador puede editar datos personales/académicos y eliminar cuentas; la eliminación
  permanente borra perfil, inscripciones y pagos, conservando la solicitud de admisión como
  registro histórico.
- **Solicitudes de revisión del estudiante:** cada carga o reemplazo de documento desde el
  portal estudiantil marca `admission_documents.review_requested_at`. `App\Support\StudentReviewRequests`
  agrupa esas solicitudes y `HandleInertiaRequests` las comparte como `adminReviewRequests`:
  la campana del encabezado administrativo
  (`resources/js/components/admin/review-notifications.tsx`) muestra el nombre del estudiante
  y el tipo de documento, el menú lateral marca con un badge la cantidad de estudiantes con
  solicitudes pendientes y el listado estudiantil agrega un badge al icono **Ver perfil** con
  la cantidad y el tipo de revisión. El dashboard resume las solicitudes en un panel.
  Solo se calculan para roles con `students.view` y `students.private.view`; al validar o
  rechazar el documento la solicitud deja de estar pendiente, ya sea desde
  `/admin/admissions/{code}` o desde la carpeta documental del perfil del estudiante.
- **Revisión y estado desde el perfil del estudiante:** con el permiso `admissions.review`
  (asignado a los roles Administrador y Decano) el perfil `/admin/students/{code}` muestra la
  tarjeta **Estado de la solicitud de admisión** con el mismo formulario de transiciones, nota
  y correo al aspirante que `/admin/admissions/{code}`, y cada documento de la carpeta privada
  incluye el formulario **Revisar documento** (validar o rechazar con observación) que envía a
  `admin.admissions.documents.review`. El permiso también habilita ambos formularios en la
  bandeja de admisiones; la edición, eliminación y conversión siguen reservadas a
  `admissions.manage`. Las alertas de revisión pendiente enlazan al documento
  (`#documento-{id}`) y su formulario aparece desplegado cuando la solicitud está pendiente.
  El formulario compartido vive en `resources/js/components/admin/document-review.tsx`.
  Debajo de la carpeta documental, la tarjeta **Historial de la solicitud** muestra la misma
  línea de tiempo de `admission_status_histories` (cambios de estado, cargas y revisiones con
  fecha, autor y nota) y solo se expone a quien tenga `students.private.view`.
  Una solicitud convertida se muestra sin transiciones manuales.
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

### Ventanas de inscripción y preinscripción

**Rutas:** `GET /admin/inscripciones` (`admin.inscripciones.index`) y
`PUT /admin/inscripciones` (`admin.inscripciones.update`) para la inscripción formal;
`GET /admin/preinscripciones` (`admin.preinscripciones.index`) y
`PUT /admin/preinscripciones` (`admin.preinscripciones.update`) para la preinscripción.
**Controlador:** `App\Http\Controllers\AdminAdmissionWindowController`
**Peticiones:** `UpdateEnrollmentWindowRequest` y `UpdateAdmissionWindowRequest`
**Modelos:** `EnrollmentWindowSetting` (`enrollment_window_settings`) y
`AdmissionWindowSetting` (`admission_window_settings`), un registro único cada uno
**Componente:** `resources/js/components/admin/admission-window-panel.tsx` en
`resources/js/pages/admin/inscripciones/index.tsx`, con la prop `variant`
**Apartado del menú:** `Inscripciones > Habilitar Inscripciones` y
`Inscripciones > Habilitar Preinscripciones`

- Cada apartado abre **su propia ventana**: el de inscripciones edita `enrollment_window_settings`
  y el de preinscripciones edita `admission_window_settings`. Ambos comparten el mismo
  componente visual, pero con textos, estado y URL de guardado distintos, y solo son
  accesibles con el permiso `admissions.window` (Administrador y Decano). Se quitaron del
  `/admin/dashboard`.
- Cada panel muestra el estado (abiertas o cerradas), las fechas de inicio y cierre y el
  selector **Automático / Abiertas / Cerradas**. Los resúmenes los construyen
  `AdmissionWindow::enrollmentAdminSummary()` y `AdmissionWindow::adminSummary()`.
- `AdmissionWindow::bannerWindow()` expone ambas ventanas: la cuenta regresiva de
  preinscripción usa `opens_at`/`closes_at` y la de inscripciones usa
  `enrollment_opens_at`/`enrollment_closes_at`, junto con sus estados y modos manuales.
- En modo automático cada ventana abre a las 8:00 a. m. (GMT-4) de la fecha de inicio y se
  deshabilita sola al terminar la fecha de cierre; los modos manuales (`open` y `closed`)
  tienen prioridad sobre el rango. `force_open` sigue habilitando la inscripción formal
  solo en desarrollo.
- La landing, `AdmissionController`, el portal del estudiante y `StudentEnrollment` usan
  el mismo cálculo de `App\Support\AdmissionWindow` según corresponda; `admissions/closed`
  distingue cierre por fecha, por cierre manual o antes de la apertura.
- Los registros se crean la primera vez con las fechas de `config/admissions.php`
  (`ADMISSIONS_OPENS_AT`, `ADMISSIONS_CLOSES_AT` y `ADMISSIONS_ENROLLMENT_OPENS_AT`).
- Pruebas: `tests/Feature/AdminAdmissionWindowTest.php` (14 casos), que cubre la
  independencia de ambas ventanas y su reflejo en la landing.

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
- `PensumSeeder` carga el pensum base de esas carreras desde los planes oficiales (53
  materias y 205 créditos en EDPRI; 39 en el resto) e incluye los bloques de libre elección
  (UNCLE) que el plan reserva por período; las ofertas UNCLE concretas se cargan aparte y no
  forman parte del pensum base.
- `SubjectCode` (`app/Support/SubjectCode.php`) y `resources/js/lib/subject-code.ts` generan
  el código de la materia desde el nombre, el periodo y la modalidad
  (`ApreMateI-PA1PRE`). En creación se recalcula en vivo; la edición manual se respeta y
  puede regenerarse con el botón **Regenerar**.
- `DemoUserSeeder` crea 13 usuarios, perfiles, inscripciones, notas y pagos de ejemplo.
- `TicStudentsSeeder` carga la nómina oficial de TIC I (60 estudiantes) tomada de la planilla
  del curso: crea la cuenta `v{cedula}@estudiante.upel.edu.ve` con la cédula como contraseña
  inicial y asigna la carrera según la especialidad de la planilla (P → EDPRI, L → LENLI,
  G → GEHIS), el cohorte y el código de expediente del año correspondiente. Es idempotente:
  si la cédula ya existe (por perfil o por solicitud convertida) solo completa sus datos y
  conserva su año de ingreso.
- `student_profiles` guarda la cédula (`identity_document`) y la cohorte (`cohort`) del
  estudiante. La planilla de evaluación y el perfil administrativo prefieren esos valores y
  solo recurren a la solicitud de admisión o al año de ingreso cuando están vacíos.
- `ScheduleFactory` genera horarios de prueba por carrera, período y cohorte.
- `AdmissionSeeder` agrega solicitudes de admisión de muestra con distintos estados y
  documentos para probar la bandeja administrativa.
- `RolePermissionSeeder` crea los 7 roles y todos los permisos, y limpia la caché de
  Spatie después de crearlos.

## 10. Pruebas automatizadas

| Archivo                                             | Cobertura                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/Feature/LandingPageTest.php`                 | Landing, fechas, metadatos y claustro publicado desde la base de datos.                                                                                                                                                                                             |
| `tests/Feature/ProfessorProfileTest.php`            | Perfil docente: datos de la cuenta, cargo, reseña, fotografía tipo carnet, validación y permisos.                                                                                                                                                                   |
| `tests/Feature/GraduatePortalTest.php`              | Páginas independientes del graduado: récord y programas, datos y restricción por rol.                                                                                                                                                                               |
| `tests/Feature/NewsletterSubscriptionTest.php`      | Alta, duplicados y validación.                                                                                                                                                                                                                                      |
| `tests/Feature/Auth/AuthenticationTest.php`         | Login por portal, admin, 2FA, logout y throttling.                                                                                                                                                                                                                  |
| `tests/Feature/AdminPortalTest.php`                 | Acceso y visibilidad de módulos por rol.                                                                                                                                                                                                                            |
| `tests/Feature/AdminCareerTest.php`                 | CRUD de carreras: permisos, validación, alta, edición y baja.                                                                                                                                                                                                       |
| `tests/Feature/AdminSubjectTest.php`                | CRUD de materias: permisos, validación, búsqueda y baja.                                                                                                                                                                                                            |
| `tests/Feature/AdminProfessorTest.php`              | Cuentas docentes, permisos, asignaciones de materias y opciones en horarios.                                                                                                                                                                                        |
| `tests/Feature/AdminScheduleTest.php`               | Horarios: permisos, filtros, alta con materias, validación, PDF, baja y prioridad en el portal.                                                                                                                                                                     |
| `tests/Feature/ScheduleClassroomTest.php`           | Aulas, asignación por materia, choques de docente/aula/materia, exportación ICS y horario del docente.                                                                                                                                                              |
| `tests/Feature/AcademicSeederTest.php`              | Solo las 4 carreras oficiales y renombrado de códigos históricos.                                                                                                                                                                                                   |
| `tests/Feature/AdmissionApplicationTest.php`        | Ventana, registro, validaciones, consulta, enlaces firmados y documentos.                                                                                                                                                                                           |
| `tests/Feature/AdminAdmissionTest.php`              | Permisos, bandeja, transiciones, aprobación, documentos y conversión con credenciales iniciales.                                                                                                                                                                    |
| `tests/Feature/PasswordDefinitionTest.php`          | Login con cédula, bloqueo del portal, definición de contraseña y validación.                                                                                                                                                                                        |
| `tests/Feature/StudentPortalTest.php`               | Expediente en el dashboard, materias del horario con docente enlazado, perfil del profesor, docentes agrupados por período y actualización de perfil.                                                                                                               |
| `tests/Feature/AdminStudentReviewTest.php`          | Solicitudes de revisión: campana, badges, validación desde el perfil e historial.                                                                                                                                                                                   |
| `tests/Feature/AdminStudentAdmissionStatusTest.php` | Estado e historial desde el perfil: permisos, transiciones y solicitudes convertidas.                                                                                                                                                                               |
| `tests/Feature/TicStudentsSeederTest.php`           | Nómina de TIC I: cédula, cohorte y especialidad, idempotencia y conservación de estudiantes existentes.                                                                                                                                                             |
| `tests/Feature/ProfessorGradeTest.php`              | Carga de notas, validación y redondeo.                                                                                                                                                                                                                              |
| `tests/Feature/ProfessorEvaluationPlanTest.php`     | Planes de evaluación: fechas del horario, ponderación, evaluaciones, notas, definitiva, roster de la página Estudiantes, cédula y cohorte del perfil y permisos.                                                                                                    |
| `tests/Unit/EvaluationPlanGradingTest.php`          | Aportes acumulados, escala de 1 a 10 y nota mínima aprobatoria.                                                                                                                                                                                                     |
| `tests/Feature/AdminAdmissionWindowTest.php`        | Ventana de inscripciones: actualización por admin y decano, permisos, validación, cierre automático y manual.                                                                                                                                                       |
| `tests/Feature/StudentEnrollmentTest.php`           | Inscripción de materias: UC asignadas, aplazadas bloqueadas, tope de créditos, desmarcado, correcciones a aprobado que salen de la planilla, planilla Diseño 2015 y PDF sin docente, registro de repitencia, suspensión a la tercera reprobación y ventana cerrada. |
| `tests/Feature/DashboardTest.php`                   | Redirecciones por rol.                                                                                                                                                                                                                                              |
| `tests/Feature/Settings/*`                          | Perfil, contraseña y seguridad.                                                                                                                                                                                                                                     |

**Resultado actual:** 417 pruebas aprobadas, 4201 aserciones.

## 11. Claustro público y perfil docente (18 de noviembre de 2026)

**Rutas:** `GET /` (sección “Profesionales que inspiran”) · `GET/PUT /dashboard/profesor/perfil`
(`professor.profile.edit` / `professor.profile.update`)
**Controladores:** `LandingController`, `ProfessorProfileController`
**Páginas:** `resources/js/pages/landing/index.tsx`,
`resources/js/components/landing/teachers.tsx`,
`resources/js/pages/dashboard/professor/profile.tsx`

### Claustro desde la base de datos

- La landing ya no usa el arreglo estático de docentes: `LandingController::index()`
  publica el prop `teachers` con `id`, `name`, `role`, `bio`, `email` y `avatar_url`.
- Se listan todos los `professor_profiles` registrados, ordenados por identificador;
  el profesor con código `PROF-001` aparece de primero.
- El cargo se toma de `position`, con respaldo en `academic_title`, `department` o
  “Docente UPEL”. La reseña usa `bio`, con respaldo en “Docente del departamento de
  {department} de la UPEL.”.
- Cada tarjeta muestra la fotografía tipo carnet del docente; si no tiene, se generan
  iniciales con `useInitials()`. El carrusel conserva flechas, puntos y navegación por
  teclado, y muestra un estado vacío cuando no hay perfiles.

### Perfil editable del docente

- El enlace **Mi perfil** del portal docente abre `/dashboard/profesor/perfil`; también se accede
  desde **Editar mi perfil** en la tarjeta “Datos del profesor” del dashboard.
- El docente puede actualizar cargo (`position`), título académico, departamento y reseña
  (`bio`, máximo 800 caracteres), y subir su fotografía tipo carnet (JPG, PNG o WEBP,
  máximo 2 MB) o quitarla. El formulario muestra una vista previa de la tarjeta de la
  landing.
- Foto, cargo, título, departamento y reseña aparecen también en la ficha administrativa
  del profesor; la fotografía se usa como avatar en la cabecera del portal y en la landing.
- Nombre, correo, código de empleado y cédula son de solo lectura: los gestiona la
  coordinación académica. La cédula sigue mostrándose en las planillas de evaluación.
- Migración `2026_11_18_204620_add_public_profile_to_professor_profiles_table.php`
  agrega `position`, `bio` y `photo_path` a `professor_profiles` (la foto se guarda en el
  disco público `public`, carpeta `professors`).
- `HandleInertiaRequests` comparte `auth.user.avatar_url` para que la cabecera del portal
  refleje la fotografía sin recargar la ficha.
- Rutas y tipos en TypeScript generados con
  `php artisan wayfinder:generate --with-form`.

## 12. Barra lateral unificada de los portales (18 de noviembre de 2026)

**Componente:** `resources/js/components/portal/portal-sidebar.tsx`
**Layouts:** `student-layout.tsx`, `admin-layout.tsx`, `professor-layout.tsx` y
`app-layout.tsx` (graduados, ajustes y páginas de cuenta)

- Los cuatro portales comparten la misma barra lateral: 268 px, fondo navy, logo UPEL,
  secciones en mayúsculas y enlace activo con degradado dorado y sombra. Solo cambia el
  nombre del portal, los grupos/enlaces y los distintivos de cada rol.
- Estudiante: “Mi vida académica” y “Cuenta y Servicios” (el enlace de inscripción
  aparece solo cuando la ventana está abierta o hay solicitud enviada).
- Administración: grupos plegables por permisos (General, Académico, Carreras, Materias,
  Horarios, Administración y Sistema); el grupo de la ruta actual se abre solo y se
  resalta únicamente el enlace más específico. Conserva los badges de solicitudes
  pendientes.
- Docente: “Mi cátedra” (incluye Planes de evaluación) y “Cuenta” (Mi perfil).
- Graduado: “Mi comunidad” (Resumen, Récord académico y Postgrados y cursos) y
  “Cuenta y Servicios” (Mi perfil y Seguridad). Cada elemento abre su propia página:
  `GET /dashboard/graduado/record` y `GET /dashboard/graduado/programas`; el resumen enlaza a ellas en lugar
  de mostrar anclas dentro de una sola página.
- El pie es idéntico en todos: enlace al portal web, cerrar sesión, nombre de la
  universidad y período/versión.
- Las cabeceras de administración, docentes y graduados se alinearon a la del portal
  estudiantil (74 px, mismo estilo de título y avatar).

## 13. Aulas, choques de horario y calendario (19 de noviembre de 2026)

**Rutas:** `/admin/classrooms` (catálogo), `/admin/schedules/{schedule}/ics`,
`/dashboard/profesor/horario` y `/dashboard/profesor/horario/ics`
**Soporte:** `App\Support\ScheduleConflictDetector`, `ProfessorSchedule` y `CalendarExport`

- **Catálogo de aulas:** tabla `classrooms` (código único, nombre, capacidad, activa),
  modelo `Classroom`, `ClassroomSeeder` (A-101, A-102, LAB-01 y AUD-01) y CRUD administrativo
  con permisos `schedules.view` / `schedules.manage`. No se puede eliminar un aula asignada
  a un horario.
- **Asignación por materia y período:** `schedule_subjects.classroom_id` se edita en el
  formulario de horarios junto a la materia y el docente. `Schedule::toScheduleArray()`
  expone `classroom_id` y `classroom` para la vista previa y la planilla.
- **Validación de choques:** `ScheduleRequest` ejecuta `ScheduleConflictDetector` antes de
  publicar o actualizar. Rechaza dos materias simultáneas del mismo grupo (carrera,
  período, cohorte, tipo de horario y modalidad), un docente repetido a la misma hora y un
  aula ocupada a la misma hora. El error se asocia a la fila `subjects.{i}.dates` y se
  muestra en el formulario. El horario que se edita se excluye de la comparación.
- **Vista del docente:** página **Mi horario** del portal docente con carrera, período,
  cohorte, materias, fechas, horas y aula de cada sesión.
- **Exportación a calendario:** archivos `.ics` (iCalendar, `America/Caracas`) con
  `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION` y `DESCRIPTION`. Disponibles desde el listado
  y el detalle de horarios de la administración y desde **Mi horario** del docente.
- **Pruebas:** `tests/Feature/ScheduleClassroomTest.php` cubre el CRUD de aulas, la
  persistencia de la asignación, los tres tipos de choque, el caso válido, la baja protegida,
  el PDF/ICS y la vista del docente.

## 14. Gestión de las diapositivas del hero (19 de noviembre de 2026)

**Rutas:** `/admin/banners` (`admin.banners.index`), `/admin/banners/create`,
`/admin/banners/{banner}/edit`, más `store`, `update` y `destroy`.
**Controlador:** `App\Http\Controllers\AdminBannerController`
**Páginas:** `resources/js/pages/admin/banners/index.tsx` y `form.tsx`
**Modelo:** `App\Models\BannerSlide` · **Permisos:** `banners.view` / `banners.manage`

- El panel permite **crear, editar, eliminar, ordenar y activar/desactivar** las
  publicaciones del baner de la landing. Cada registro guarda etiqueta, título en tres
  partes (inicio, destacado y final), descripción, presentación del lateral, imagen
  opcional, etiquetas y enlaces opcionales de los dos botones, orden y estado.
- Se eliminaron las tarjetas decorativas fijas (Campus Virtual, noticia, congreso y
  portal). En **Presentación del lateral** solo se elige entre `imagen` (archivo subido
  por el administrador) y `countdown` (una única cuenta regresiva con fecha propia).
  Las migraciones `2026_11_19_220000_add_image_path_to_banner_slides_table.php` y
  `2026_11_19_233000_replace_banner_countdown_visuals.php` agregan `image_path`,
  `countdown_at` y `countdown_label`, y convierten las diapositivas antiguas.
- La imagen se sube por diapositiva (JPG, PNG o WEBP, máximo 2 MB) y se guarda en
  `storage/app/public/banners` con `Storage::disk('public')`. `BannerSlide::imageUrl()`
  expone la URL pública; al reemplazarla o quitarla se borra el archivo anterior, y al
  eliminar la diapositiva también se elimina su imagen.
- La cuenta regresiva es **una sola** y toma la fecha y hora elegidas en el formulario
  (`countdown_at`, `datetime-local` convertido a ISO en `America/Caracas`) junto con su
  etiqueta (`countdown_label`). El cliente calcula días, horas, minutos y segundos
  restantes desde el día de publicación hasta esa fecha; si ya pasó muestra `00` y el
  aviso correspondiente. Las ventanas de admisión ya no gobiernan esta tarjeta.
- `BannerRequest` valida longitudes, presentación válida, imagen, fecha de cuenta
  regresiva y URLs seguras (`#`, `/`, `http(s)`), y restringe la gestión a
  `banners.manage`.
- La landing consume las publicaciones activas ordenadas desde `LandingController`
  (prop `heroSlides`, con `image_url`, `countdown_at` y `countdown_label`).
  `HeroSlider` usa diapositivas de respaldo cuando no hay registros publicados, así
  que el baner nunca queda vacío.
- El formulario de alta y edición muestra una **vista previa en vivo** del baner a la
  derecha (apilada bajo el formulario en pantallas estrechas). `HeroSlideStage` se
  extrajo de `HeroSlider` y lo reutilizan la landing y
  `components/admin/banner-preview.tsx`, escalado al ancho del panel, para que el
  resultado mostrado sea idéntico al publicado. Incluye la imagen seleccionada y las
  cuentas regresivas con las fechas reales; los botones de la vista previa no navegan.
- `BannerSlideSeeder` siembra las cinco publicaciones originales sin sobrescribir
  ediciones posteriores; los permisos se otorgan al rol administrador por migración.
- El menú lateral muestra el acceso **Publicaciones del baner** bajo
  **Publicaciones**, y las rutas TypeScript se generan con Wayfinder.
- **Pruebas:** `tests/Feature/AdminBannerTest.php` cubre permisos, listado, alta, edición,
  baja, validación, subida/reemplazo/borrado de imagen, ventanas de fecha y publicación
  ordenada/solo activa en la landing.

## 15. Gestión de noticias y apartado «Publicaciones» (19 de noviembre de 2026)

**Rutas:** `/admin/news` (`admin.news.index`), `/admin/news/create`,
`/admin/news/{newsPost}/edit`, más `store`, `update` y `destroy`.
**Controlador:** `App\Http\Controllers\AdminNewsController`
**Páginas:** `resources/js/pages/admin/news/index.tsx` y `form.tsx`
**Modelo:** `App\Models\NewsPost` · **Permisos:** `news.view` / `news.manage`

- El menú lateral agrupa ambos contenidos bajo **Publicaciones**, con los enlaces
  **Publicaciones de banner** y **Noticias y novedades** (antes el baner estaba en
  _Administración_). El panel principal muestra los dos módulos.
- El CRUD de noticias permite crear, editar, eliminar, ordenar y publicar/despublicar
  las tarjetas de «Noticias y novedades»: categoría, fecha, título, resumen, ilustración,
  enlace opcional de «Leer más», orden y estado.
- `NewsPostRequest` valida fechas, ilustración permitida y URLs seguras
  (`#`, `/`, `http(s)`), y restringe la gestión a `news.manage`.
- La landing recibe las noticias activas ordenadas en la prop `newsPosts`; el componente
  `News` usa las seis noticias originales como respaldo y deriva el gradiente de cada
  tarjeta a partir de la ilustración elegida.
- `NewsPostSeeder` siembra las seis noticias originales sin sobrescribir ediciones; los
  permisos se otorgan al rol administrador por migración. Las rutas TypeScript se
  generan con Wayfinder (usar `php artisan wayfinder:generate --with-form`).
- **Pruebas:** `tests/Feature/AdminNewsTest.php` cubre permisos, listado, alta, edición,
  baja, validación y publicación ordenada/solo activa en la landing.
