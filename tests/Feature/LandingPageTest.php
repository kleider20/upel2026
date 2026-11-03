<?php

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
