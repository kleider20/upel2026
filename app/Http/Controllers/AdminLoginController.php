<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminLoginController extends Controller
{
    /**
     * Muestra el acceso exclusivo del portal administrativo.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user !== null) {
            return $user->isAdminPortalUser()
                ? redirect()->route('admin.dashboard')
                : redirect()
                    ->route('dashboard')
                    ->with('error', 'Tu cuenta no tiene acceso al portal administrativo.');
        }

        return Inertia::render('admin/login', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
