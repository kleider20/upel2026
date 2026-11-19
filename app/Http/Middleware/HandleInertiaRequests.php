<?php

namespace App\Http\Middleware;

use App\Enums\Permission;
use App\Models\Enrollment;
use App\Models\User;
use App\Support\AdmissionWindow;
use App\Support\StudentReviewRequests;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user !== null ? [
                    ...$user->only([
                        'id',
                        'name',
                        'email',
                        'email_verified_at',
                        'created_at',
                        'updated_at',
                    ]),
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                    'portal_role' => $user->portalRole()?->value,
                    'portal_role_label' => $user->portalRole()?->label(),
                    'avatar_url' => $user->isProfessor()
                        ? $user->professorProfile?->photoUrl()
                        : null,
                ] : null,
            ],
            'flash' => [
                'success' => fn (): ?string => $request->session()->get('success'),
                'error' => fn (): ?string => $request->session()->get('error'),
            ],
            'studentNotifications' => fn (): array => $user?->isStudent()
                ? [
                    'unread_count' => $user->unreadNotifications()->count(),
                    'items' => $user->notifications()
                        ->latest()
                        ->limit(8)
                        ->get()
                        ->map(static fn ($notification): array => [
                            'id' => $notification->id,
                            'title' => data_get($notification->data, 'title', 'Notificación'),
                            'message' => data_get($notification->data, 'message', ''),
                            'is_read' => $notification->read_at !== null,
                        ])
                        ->all(),
                ]
                : ['unread_count' => 0, 'items' => []],
            'adminReviewRequests' => fn (): array => $this->adminReviewRequests($user),
            'studentEnrollment' => fn (): array => $this->studentEnrollment($user),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Ventana de inscripción que ven los estudiantes en su portal.
     *
     * @return array{is_open: bool, submitted: bool, url: string, opens_at: string, closes_at: string, reason: string}
     */
    private function studentEnrollment(?User $user): array
    {
        $empty = [
            'is_open' => false,
            'submitted' => false,
            'url' => '',
            'opens_at' => '',
            'closes_at' => '',
            'reason' => '',
        ];

        if ($user === null || ! $user->isStudent()) {
            return $empty;
        }

        $window = new AdmissionWindow;

        return [
            'is_open' => $window->isEnrollmentOpen(),
            'submitted' => Enrollment::query()
                ->where('student_id', $user->id)
                ->whereHas('academicPeriod', static fn ($query) => $query->where('ends_at', '>=', now()))
                ->exists(),
            'url' => route('student.enrollment.index', absolute: false),
            'opens_at' => $window->enrollmentOpensAt()->format('d/m/Y'),
            'closes_at' => $window->enrollmentClosesAt()->format('d/m/Y'),
            'reason' => $window->enrollmentClosureContext()['reason'],
        ];
    }

    /**
     * Solicitudes de revisión que el personal autorizado debe atender.
     *
     * @return array{can_review: bool, pending_students: int, pending_total: int, items: array<int, array{id: int, student_name: string, student_code: string|null, type: string, type_label: string, message: string, requested_at: string|null, url: string|null}>}
     */
    private function adminReviewRequests(?User $user): array
    {
        $empty = [
            'can_review' => false,
            'pending_students' => 0,
            'pending_total' => 0,
            'items' => [],
        ];

        if (
            $user === null
            || ! $user->can(Permission::StudentsView->value)
            || ! $user->can(Permission::StudentsViewPrivate->value)
        ) {
            return $empty;
        }

        return ['can_review' => true, ...StudentReviewRequests::overview()];
    }
}
