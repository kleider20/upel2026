<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Redirige a cada usuario al portal que le corresponde.
     *
     * @param  mixed  $request
     * @return Response
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $user = $request->user();

        if ($user?->needsPasswordChange()) {
            return redirect()->route('password.define');
        }

        $destination = $user?->isAdminPortalUser()
            ? route('admin.dashboard')
            : route('dashboard');

        return redirect()->intended($destination);
    }
}
