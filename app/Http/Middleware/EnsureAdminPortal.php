<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPortal
{
    /**
     * Permite el acceso únicamente a los roles del portal administrativo.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->guest(route('admin.login'));
        }

        if (! $user->isAdminPortalUser()) {
            return redirect()
                ->route('dashboard')
                ->with('error', 'Tu cuenta no tiene acceso al portal administrativo.');
        }

        return $next($request);
    }
}
