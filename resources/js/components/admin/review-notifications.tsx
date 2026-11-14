import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, FileCheck2 } from 'lucide-react';
import { module as adminModule } from '@/routes/admin';
import type { AdminReviewRequestsData } from '@/types';

type ReviewNotificationsProps = {
    requests: AdminReviewRequestsData;
};

/**
 * Campana con las solicitudes de revisión que los estudiantes envían desde su perfil.
 */
export function ReviewNotifications({ requests }: ReviewNotificationsProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const count = requests.pending_total;
    const studentLabel =
        requests.pending_students === 1
            ? '1 estudiante'
            : `${requests.pending_students} estudiantes`;

    useEffect(() => {
        if (!open) {
            return;
        }

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (
                event.target instanceof Node &&
                !containerRef.current?.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);

        return () =>
            document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, [open]);

    if (!requests.can_review) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((isOpen) => !isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                aria-label={`Solicitudes de revisión${count > 0 ? `: ${count} pendientes` : ''}`}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {count > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-extrabold text-white">
                        {count > 99 ? '99+' : count}
                    </span>
                ) : null}
            </button>

            {open ? (
                <section
                    className="absolute top-full right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:bg-card"
                    role="dialog"
                    aria-label="Solicitudes de revisión"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <h3 className="text-sm font-bold text-upel-navy dark:text-foreground">
                            Solicitudes de revisión
                        </h3>
                        {count > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.62rem] font-extrabold text-amber-800">
                                {count} pendiente{count === 1 ? '' : 's'}
                            </span>
                        ) : null}
                    </div>

                    {requests.items.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                            No hay solicitudes pendientes.
                        </p>
                    ) : (
                        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                            {requests.items.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={
                                            item.url ?? adminModule('students')
                                        }
                                        onClick={() => setOpen(false)}
                                        className="flex gap-3 px-4 py-3 text-left transition-colors hover:bg-upel-cloud/70 dark:hover:bg-muted/70"
                                    >
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                            <FileCheck2
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xs leading-relaxed font-semibold text-upel-navy dark:text-foreground">
                                                {item.message}
                                            </span>
                                            {item.requested_at ? (
                                                <span className="mt-1 block text-[0.65rem] font-semibold text-muted-foreground">
                                                    {item.requested_at}
                                                </span>
                                            ) : null}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="border-t border-border px-4 py-2.5">
                        <Link
                            href={adminModule('students')}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-2 text-[0.68rem] font-bold text-upel-blue hover:text-upel-navy dark:hover:text-foreground"
                        >
                            <span>
                                {requests.pending_students > 0
                                    ? `${studentLabel} con solicitudes pendientes`
                                    : 'Ir al módulo de estudiantes'}
                            </span>
                            <ChevronRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
