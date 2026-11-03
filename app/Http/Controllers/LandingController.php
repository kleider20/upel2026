<?php

namespace App\Http\Controllers;

use App\Support\AdmissionWindow;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function __construct(private AdmissionWindow $window) {}

    /**
     * Show the public UPEL landing page.
     *
     * Las fechas se calculan en la zona horaria de Venezuela (GMT-4) y se
     * envían al frontend como cadenas ISO-8601 para que los contadores y los
     * estados de los botones se mantengan sincronizados con el servidor.
     */
    public function index(): Response
    {
        return Inertia::render('landing/index', [
            'canRegister' => $this->window->isOpen(),
            'canEnroll' => $this->window->isEnrollmentOpen(),
            'preEnrollmentOpensAt' => $this->window->opensAt()->toIso8601String(),
            'enrollmentOpensAt' => $this->window->enrollmentOpensAt()->toIso8601String(),
            'graduationDate' => $this->window->graduationAt()->toIso8601String(),
        ]);
    }
}
