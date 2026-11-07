# 03 · Módulos pendientes

Funcionalidades que **todavía no existen** o que solo están representadas de forma
parcial. Se ordenan por prioridad sugerida.

## Prioridad alta

> La numeración conserva los identificadores originales; los números ausentes
> corresponden a módulos ya completados y documentados en
> [`02-modulos-actuales.md`](./02-modulos-actuales.md).

### 2. CRUD administrativo real

**Estado:** parcial. **Carreras** y **materias** ya tienen CRUD completo con validación
(`CareerRequest`, `SubjectRequest`), búsqueda, paginación y pruebas
(`AdminCareerTest`, `AdminSubjectTest`). Los demás módulos de `AdminModuleController`
siguen en solo lectura.
**Falta:**

- Formularios de alta, edición y baja para estudiantes, profesores, programas y usuarios.
- Validaciones con `FormRequest`.
- Eliminación lógica o restricción por integridad referencial.
- Historial de cambios y confirmación de acciones destructivas.
- Extender paginación, búsqueda y filtros del lado del servidor al resto de módulos.

Los permisos `*.manage` ya existen; los consume el CRUD de carreras, materias y el flujo
de **admisiones** (`AdminAdmissionController`).

### 3. Gestión financiera operativa

**Estado:** el módulo `finance` solo lista pagos sembrados.
**Falta:**

- Registrar pagos manualmente y conciliar pagos.
- Generar recibos y estados de cuenta en PDF.
- Configurar conceptos, montos y vencimientos por período.
- Marcar pagos vencidos automáticamente (tarea programada).
- Integración con pasarela de pago para inscripciones y mensualidades.
- Notificaciones de cobranza.

### 4. Trámites persistentes y documentos oficiales

**Estado:** `Student\TramiteController` guarda las solicitudes **en sesión**; se pierden
al cerrar sesión.
**Falta:**

- Tabla `tramites` con estado, fechas, responsable y observaciones.
- Flujo administrativo: recibido → en proceso → listo → entregado.
- Generación de PDF con firma digital y código de verificación.
- Notificación al estudiante cuando el documento esté listo.
- Historial descargable.

### 5. Horarios académicos reales

**Estado:** parcial. `MiHorario` ya muestra el horario oficial de Educación Primaria
período 1 (`App\Support\StudentSchedule`), con sus 16 semanas y las dos cuadrículas
del documento, filtrado por el horario elegido en la preinscripción (sabatino →
sábados). `GET /estudiante/horario/pdf` genera el PDF oficial
(`App\Support\StudentSchedulePdf`) para imprimir o descargar.
La administración ya publica horarios por carrera, período y cohorte desde
`/admin/schedules` (tablas `schedules` y `schedule_subjects`, vista previa y PDF):
elige las materias de la carrera y el período, evita repetirlas y toma el código y el
docente de cada una. El portal del estudiante prioriza el horario publicado sobre el
catálogo transcrito.
La administración también define el rango de clases (fecha de inicio y fin), el tipo de
horario (sabatino o lunes a viernes), la hora libre de cada materia y sus fechas exactas
con `App\Support\ScheduleCalendar`; la cuadrícula y el PDF se generan desde ese rango.
**Falta:**

- Asignación de aula por materia y período desde la administración.
- Validación de choques de horario (materias, docentes o aulas solapadas).
- Vista de horario para profesores.
- Exportación a calendario.

## Prioridad media

### 6. CMS de noticias, eventos y banners

**Estado:** las noticias y el hero son datos estáticos en `resources/js/data`.
**Falta:**

- Tablas `posts`, `categories`, `media`.
- Editor administrativo con imágenes y borradores.
- Publicación programada y destacados.
- Página de detalle de noticia (`/noticias/{slug}`) con SEO propio.
- Gestión de las diapositivas del hero desde el panel.

### 7. Gestión de cursos, talleres y postgrados

**Estado:** catálogo informativo en la landing y en el portal del graduado.
**Falta:**

- Inscripción a cursos y talleres con cupo y pago.
- Admisión de especializaciones, maestrías y doctorados.
- Requisitos, cronograma y documentación por programa.
- Panel del participante con materiales y certificados.
- Emisión de certificados.

### 8. Notificaciones y correo transaccional

**Estado:** parcial. Las admisiones ya envían `AdmissionReceived`, `AdmissionStatusChanged`
(que cubre la preinscripción aprobada) y `AdmissionConverted`, todos en cola.
**Falta:**

- Plantillas institucionales para el resto de eventos (bienvenida, notas publicadas, pago
  recibido, trámite listo).
- Notificaciones dentro de la aplicación (campana y centro de avisos).
- Preferencias de notificación por usuario.
- Cola de trabajos dedicada para envíos masivos.

### 9. Reportes y exportaciones

**Falta:**

- Exportación a PDF/Excel de listados administrativos.
- Actas de notas por materia y período.
- Récord académico oficial y constancia de estudios reales.
- Reportes de rendimiento por carrera, materia y docente.
- Indicadores de deserción, aprobación y promedio institucional.

### 10. Períodos académicos y cierre de semestre

**Estado:** parcial. Ya existen la tabla `academic_periods`, el modelo
`AcademicPeriod` y su siembra (`AcademicSeeder`); no hay administración ni lógica de
apertura/cierre.
**Falta:**

- CRUD de `academic_periods` con apertura y cierre.
- Ventanas de inscripción y carga de notas por período.
- Bloqueo de notas al cerrar el período.
- Cálculo de índice académico por estudiante y período.

### 11. Portal del profesor ampliado

**Falta:**

- Página de perfil docente editable.
- Gestión de materiales y anuncios por materia.
- Lista de estudiantes con historial académico.
- Carga masiva de notas (CSV/Excel).
- Asistencia y planificación de clases.

### 12. Portal del graduado ampliado

**Falta:**

- Actualización de datos profesionales y de contacto.
- Solicitud de constancias de egresado.
- Seguimiento de estudios de postgrado.
- Bolsa de trabajo o registro de egresados.

## Prioridad baja

### 13. Seguridad avanzada

- Exigir 2FA a todos los roles administrativos.
- Passkeys dentro de la nueva página de login (hoy existe el backend, pero la página
  rediseñada no muestra el acceso por passkey).
- Registro de auditoría de accesos y acciones sensibles.
- Política de expiración y complejidad de contraseñas por rol.

### 14. Experiencia y calidad

**Estado:** parcial. La landing ya tiene `LandingErrorBoundary`, navegación por teclado y
`aria-*`; existen estado vacío (`portal/empty-state.tsx`) y esqueleto (`ui/skeleton.tsx`).
**Falta:**

- Pruebas de extremo a extremo (Playwright o Dusk) para login, portales y notas.
- Auditoría de accesibilidad (WCAG 2.1 AA) completa y navegación solo con teclado en los
  portales.
- Revisión responsive en dispositivos reales.
- Extender estados vacíos, esqueletos de carga y manejo de errores homogéneo al resto de
  páginas.
- Internacionalización (español/inglés) si se requiere.

### 15. Infraestructura y despliegue

**Estado:** parcial. GitHub Actions (`.github/workflows/tests.yml` → `composer ci:check`)
ejecuta `vp check`, `npm run types:check` y Pest en cada push a `main` y en cada PR.
**Falta:**

- Definir entorno de producción y base de datos definitiva (hoy SQLite local).
- Añadir Pint al pipeline de CI.
- Backups, monitoreo y alertas.
- Documentación de despliegue en Laravel Cloud o servidor propio.

### 16. API e integraciones

- API versionada para futuras apps móviles.
- Integración con sistemas de pago y con el Ministerio de Educación.
- Exportación/importación con sistemas académicos existentes.

## Dependencias recomendadas

1. Completar **CRUD administrativo** antes de los reportes (necesitan datos confiables).
2. Persistir **trámites** antes de generar documentos oficiales.
3. Implementar **períodos académicos** antes del cierre de notas y del índice académico.
4. Implementar la **inscripción formal / matrícula en línea** (único pendiente del módulo
   de admisión) sobre las solicitudes ya convertidas en estudiantes.
