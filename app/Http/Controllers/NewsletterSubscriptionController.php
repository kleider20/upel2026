<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsletterSubscriptionController extends Controller
{
    /**
     * Store a new newsletter subscription from the landing footer.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:newsletter_subscribers,email'],
        ], [
            'email.required' => 'Ingresa tu correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.unique' => 'Este correo ya está suscrito a nuestro boletín.',
        ]);

        NewsletterSubscriber::create([
            'email' => Str::lower($validated['email']),
        ]);

        return back()->with('success', '¡Gracias por suscribirte! Recibirás nuestras novedades académicas.');
    }
}
