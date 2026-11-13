<?php

use App\Models\Career;
use App\Models\CareerOffering;
use App\Models\Subject;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('la landing se renderiza con las inscripciones cerradas antes de noviembre', function () {
    $this->travelTo(Carbon::parse('2026-10-24T12:00:00-04:00'));

    $response = $this->get(route('landing'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('canRegister', false)
            ->where('canEnroll', false)
            ->where('preEnrollmentOpensAt', '2026-11-02T08:00:00-04:00')
            ->where('enrollmentOpensAt', '2027-01-12T08:00:00-04:00')
            ->where('graduationDate', '2026-12-12T09:00:00-04:00')
        );
});

test('la landing habilita las preinscripciones desde el 2 de noviembre', function () {
    $this->travelTo(Carbon::parse('2026-11-02T08:00:00-04:00'));

    $response = $this->get(route('landing'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('canRegister', true)
            ->where('canEnroll', false)
        );
});

test('la landing habilita la inscripción regular desde enero de 2027', function () {
    $this->travelTo(Carbon::parse('2027-01-12T08:00:00-04:00'));

    $response = $this->get(route('landing'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->where('canRegister', true)
            ->where('canEnroll', true)
        );
});

test('la landing solo lista carreras con ofertas académicas activas', function () {
    $offered = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'description' => 'Formación para acompañar el desarrollo integral de niños y niñas en la etapa primaria, con herramientas didácticas innovadoras.',
        'degree' => 'Licenciatura',
        'icon' => '📚',
        'duration_semesters' => 8,
    ]);

    CareerOffering::factory()->for($offered)->create([
        'modality' => 'online',
        'is_active' => true,
    ]);
    CareerOffering::factory()->for($offered)->create([
        'modality' => 'presencial',
        'is_active' => true,
    ]);

    // Carrera activa sin ofertas registradas.
    Career::factory()->create(['name' => 'Carrera sin oferta', 'code' => 'SINOFR']);

    // Carrera activa cuyas ofertas están desactivadas.
    $withInactiveOffer = Career::factory()->create([
        'name' => 'Carrera con oferta inactiva',
        'code' => 'OFIACT',
    ]);
    CareerOffering::factory()->for($withInactiveOffer)->create([
        'is_active' => false,
    ]);

    // Carrera desactivada aunque tenga oferta activa.
    $inactiveCareer = Career::factory()->create([
        'name' => 'Carrera desactivada',
        'code' => 'DESACT',
        'is_active' => false,
    ]);
    CareerOffering::factory()->for($inactiveCareer)->create([
        'is_active' => true,
    ]);

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('careers', 1)
            ->where('careers.0.code', 'EDPRI')
            ->where('careers.0.degree', 'Licenciatura')
            ->where('careers.0.icon', '📚')
            ->where('careers.0.duration', '4 años')
            ->where('careers.0.modality', 'mixta')
            ->where('careers.0.show_url', route('careers.show', ['career' => 'EDPRI']))
        );
});

test('la landing usa la modalidad de la única oferta activa de una carrera', function () {
    $career = Career::factory()->create([
        'name' => 'Lengua y Literatura',
        'code' => 'LENLI',
        'modality' => 'presencial',
    ]);

    CareerOffering::factory()->for($career)->create([
        'modality' => 'online',
        'is_active' => true,
    ]);

    $this->get(route('landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/index')
            ->has('careers', 1)
            ->where('careers.0.modality', 'online')
        );
});

test('la página pública de una carrera muestra su pensum agrupado por período', function () {
    $career = Career::factory()->create([
        'name' => 'Educación Primaria',
        'code' => 'EDPRI',
        'degree' => 'Licenciatura',
        'icon' => '📚',
        'modality' => 'presencial',
        'duration_semesters' => 8,
    ]);

    CareerOffering::factory()->for($career)->create([
        'modality' => 'online',
        'schedule' => 'lunes_viernes',
        'shift' => 'diurno',
        'is_active' => true,
    ]);

    Subject::factory()->for($career)->create([
        'name' => 'Didáctica General',
        'code' => 'DID-101',
        'semester' => 1,
        'credits' => 4,
        'is_active' => true,
    ]);
    Subject::factory()->for($career)->create([
        'name' => 'Psicología del Desarrollo',
        'code' => 'PSI-101',
        'semester' => 1,
        'credits' => 3,
        'is_active' => true,
    ]);
    Subject::factory()->for($career)->create([
        'name' => 'Currículo',
        'code' => 'CUR-201',
        'semester' => 2,
        'credits' => 5,
        'is_active' => true,
    ]);
    Subject::factory()->for($career)->create([
        'name' => 'Materia inactiva',
        'code' => 'INA-101',
        'semester' => 3,
        'credits' => 2,
        'is_active' => false,
    ]);

    $this->get(route('careers.show', ['career' => 'EDPRI']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing/career')
            ->where('career.name', 'Educación Primaria')
            ->where('career.degree', 'Licenciatura')
            ->where('career.icon', '📚')
            ->where('career.duration', '4 años')
            ->where('career.modality', 'online')
            ->where('career.subjects_count', 3)
            ->where('career.credits_total', 12)
            ->has('career.offerings', 1)
            ->where('career.offerings.0.modality_label', 'Online')
            ->where('career.offerings.0.schedule_label', 'Lunes a viernes')
            ->has('pensum', 2)
            ->where('pensum.0.semester', 1)
            ->where('pensum.0.label', 'I')
            ->where('pensum.0.credits', 7)
            ->has('pensum.0.subjects', 2)
            ->where('pensum.1.semester', 2)
            ->where('pensum.1.credits', 5)
        );
});

test('la página pública de una carrera inactiva responde 404', function () {
    Career::factory()->create([
        'code' => 'INACT',
        'is_active' => false,
    ]);

    $this->get(route('careers.show', ['career' => 'INACT']))
        ->assertNotFound();
});
