<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordDefinitionController extends Controller
{
    use PasswordValidationRules;

    /**
     * Muestra el formulario para definir la contraseña inicial.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('auth/define-password', [
            'email' => $request->user()?->email,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    /**
     * Guarda la contraseña elegida por el estudiante y libera el portal.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => $this->passwordRules(),
        ]);

        $request->user()?->forceFill([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ])->save();

        return redirect()
            ->route('dashboard')
            ->with('success', 'Tu contraseña quedó definida. ¡Bienvenido al campus!');
    }
}
