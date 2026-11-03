<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminEntryController extends Controller
{
    /**
     * Punto de entrada del portal administrativo.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('admin.login');
        }

        return $user->isAdminPortalUser()
            ? redirect()->route('admin.dashboard')
            : redirect()
                ->route('dashboard')
                ->with('error', 'Tu cuenta no tiene acceso al portal administrativo.');
    }
}
