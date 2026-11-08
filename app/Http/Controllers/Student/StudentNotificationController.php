<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudentNotificationController extends Controller
{
    /**
     * Mark one of the authenticated student's notifications as read.
     */
    public function __invoke(Request $request, string $notification): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStudent(), 403);

        $user
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail()
            ->markAsRead();

        return back();
    }
}
