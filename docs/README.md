# Documentación del proyecto UPEL 2026

Esta carpeta reúne la documentación funcional y técnica de la plataforma académica de la
Universidad Pedagógica Experimental Libertador (UPEL).

## Índice

| Archivo                                                              | Contenido                                                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`01-informacion-del-proyecto.md`](./01-informacion-del-proyecto.md) | Contexto, alcance, stack, estructura, instalación, credenciales y modelo de datos. |
| [`02-modulos-actuales.md`](./02-modulos-actuales.md)                 | Módulos implementados y funcionalidades disponibles hoy.                           |
| [`03-modulos-pendientes.md`](./03-modulos-pendientes.md)             | Módulos y funcionalidades que aún no se han construido.                            |
| [`04-correcciones-pendientes.md`](./04-correcciones-pendientes.md)   | Errores, deudas técnicas e inconsistencias detectadas y aún abiertas.              |
| [`05-correcciones-realizadas.md`](./05-correcciones-realizadas.md)   | Historial de correcciones ya aplicadas y verificadas.                              |

## Estado verificado

- `php artisan test --compact` → **163 pruebas aprobadas, 887 aserciones**.
- `npm run types:check` → sin errores.
- `vendor/bin/pint --dirty --format agent` → sin cambios pendientes.
- Última verificación: **2 de noviembre de 2026**.

## Cómo mantener esta documentación

1. Al cerrar un módulo nuevo, mover su descripción de `03-modulos-pendientes.md` a
   `02-modulos-actuales.md`.
2. Al corregir un fallo, mover su ficha de `04-correcciones-pendientes.md` a
   `05-correcciones-realizadas.md` indicando la fecha y los archivos tocados.
3. Si cambia el stack o los comandos de arranque, actualizar
   `01-informacion-del-proyecto.md`.

Los pasos 1 y 2 los aplica el asistente automáticamente al terminar y verificar el
trabajo, sin necesidad de pedirlo (ver regla _documentation backlog rules_ en
`AGENTS.md`). Un pendiente nunca debe seguir listado en `03`/`04` después de completarse,
ni duplicarse en `02`/`05`.
