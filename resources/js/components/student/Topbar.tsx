import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { read } from '@/routes/student/notifications';
import type { Auth } from '@/types';
import type { StudentTab } from './Sidebar';
import type { StudentNotificationsData } from '@/types/student';

type TopbarProps = {
    activeTab: StudentTab;
    onOpenMobile: () => void;
    onSelectTab: (tab: StudentTab) => void;
};

const tabTitles: Record<StudentTab, string> = {
    inicio: 'Resumen Personal',
    solicitud: 'Mi Solicitud de Admisión',
    materias: 'Mis Materias',
    calificaciones: 'Mis Calificaciones',
    profesores: 'Mis Profesores',
    pensum: 'Mi Carrera y Pénsum',
    horario: 'Mi Horario',
    perfil: 'Mi Perfil',
    tramites: 'Mis Trámites y Constancias',
};

export function Topbar({ activeTab, onOpenMobile, onSelectTab }: TopbarProps) {
    const { auth, studentNotifications } = usePage<{
        auth: Auth;
        studentNotifications: StudentNotificationsData;
    }>().props;
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const user = auth.user;
    const unreadCount = studentNotifications.unread_count;
    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : 'UP';

    useEffect(() => {
        if (!notificationsOpen) {
            return;
        }

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (
                event.target instanceof Node &&
                !notificationsRef.current?.contains(event.target)
            ) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);

        return () =>
            document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, [notificationsOpen]);

    const openNotification = (notificationId: string) => {
        router.patch(
            read.url(notificationId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNotificationsOpen(false);
                    onSelectTab('horario');
                },
            },
        );
    };

    return (
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:bg-card/90 print:hidden">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenMobile}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-upel-navy hover:bg-upel-cloud lg:hidden dark:text-foreground dark:hover:bg-muted"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div>
                    <span className="text-[0.62rem] font-bold tracking-[0.14em] text-upel-blue uppercase">
                        Portal Estudiantil
                    </span>
                    <h2 className="font-display text-lg font-bold text-upel-navy sm:text-xl dark:text-foreground">
                        {tabTitles[activeTab]}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div ref={notificationsRef} className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setNotificationsOpen((isOpen) => !isOpen)
                        }
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                        aria-label={`Notificaciones${unreadCount > 0 ? `: ${unreadCount} sin leer` : ''}`}
                        aria-expanded={notificationsOpen}
                        aria-haspopup="dialog"
                    >
                        <Bell className="h-5 w-5" aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-extrabold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <section
                            className="absolute top-full right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:bg-card"
                            role="dialog"
                            aria-label="Notificaciones"
                        >
                            <div className="border-b border-border px-4 py-3">
                                <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    Notificaciones
                                </h3>
                            </div>

                            {studentNotifications.items.length === 0 ? (
                                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                                    No tienes notificaciones.
                                </p>
                            ) : (
                                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                                    {studentNotifications.items.map(
                                        (notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openNotification(
                                                            notification.id,
                                                        )
                                                    }
                                                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-upel-cloud/70 dark:hover:bg-muted/70"
                                                >
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                            notification.is_read
                                                                ? 'bg-transparent'
                                                                : 'bg-upel-blue'
                                                        }`}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="block text-xs font-bold text-upel-navy dark:text-foreground">
                                                            {notification.title}
                                                        </span>
                                                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                                            {
                                                                notification.message
                                                            }
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </section>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onSelectTab('perfil')}
                    className="group flex items-center gap-2.5 rounded-2xl border border-border bg-upel-cloud/50 p-1.5 pr-3 transition-colors hover:bg-upel-cloud dark:bg-muted/50 dark:hover:bg-muted"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-upel-navy text-xs font-extrabold text-upel-gold shadow-sm">
                        {initials}
                    </div>
                    <div className="hidden text-left sm:block">
                        <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                            {user?.name ?? 'Estudiante'}
                        </p>
                        <p className="text-[0.62rem] font-semibold text-emerald-600 dark:text-emerald-400">
                            ● Estudiante activo
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
}
