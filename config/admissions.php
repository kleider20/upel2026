<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Ventana de preinscripción
    |--------------------------------------------------------------------------
    |
    | Fechas oficiales del proceso de admisión 2027 en hora de Venezuela
    | (GMT-4). Se usan tanto en la landing como en el formulario público.
    |
    */

    'opens_at' => env('ADMISSIONS_OPENS_AT', '2026-11-02T08:00:00-04:00'),

    'enrollment_opens_at' => env('ADMISSIONS_ENROLLMENT_OPENS_AT', '2027-01-12T08:00:00-04:00'),

    'graduation_at' => env('ADMISSIONS_GRADUATION_AT', '2026-12-12T09:00:00-04:00'),

    /*
    |--------------------------------------------------------------------------
    | Apertura forzada (solo desarrollo)
    |--------------------------------------------------------------------------
    |
    | Permite probar el formulario antes de la fecha oficial sin alterar la
    | regla de negocio. En producción debe permanecer en false.
    |
    */

    'force_open' => (bool) env('ADMISSIONS_FORCE_OPEN', false),

    /*
    |--------------------------------------------------------------------------
    | Período académico de la convocatoria
    |--------------------------------------------------------------------------
    */

    'period_year' => (int) env('ADMISSIONS_PERIOD_YEAR', 2027),

    /*
    |--------------------------------------------------------------------------
    | Documentos del expediente
    |--------------------------------------------------------------------------
    */

    'documents' => [
        'disk' => env('ADMISSIONS_DOCUMENTS_DISK', 'local'),
        'max_kb' => (int) env('ADMISSIONS_DOCUMENTS_MAX_KB', 5120),
        'path' => 'admissions',
    ],

    /*
    |--------------------------------------------------------------------------
    | Enlaces de seguimiento
    |--------------------------------------------------------------------------
    */

    'tracking_days' => (int) env('ADMISSIONS_TRACKING_DAYS', 60),

];
