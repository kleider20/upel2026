<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsDefined
{
    /**
     * Obliga a los usuarios con contraseña inicial a definir una propia.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->needsPasswordChange()) {
            return $next($request);
        }

        if ($request->routeIs('password.define', 'password.define.update', 'logout')) {
            return $next($request);
        }

        return redirect()->route('password.define');
    }
}
