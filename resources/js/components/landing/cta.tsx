import { usePage, router } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/landing/reveal';
import { create as admissionCreate } from '@/routes/admissions';

function daysUntil(target: string): number {
    const difference = new Date(target).getTime() - Date.now();

    return Math.max(0, Math.ceil(difference / 86_400_000));
}

/**
 * Llamado a la acción final. El estado del botón y el mensaje
 * dependen de la fecha de apertura de preinscripciones.
 */
export function CTA({
    canRegister,
    registrationOpensAt,
    onLoginClick,
}: {
    canRegister: boolean;
    registrationOpensAt: string;
    onLoginClick: () => void;
}) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const user = auth?.user;
    const remainingDays = daysUntil(registrationOpensAt);

    return (
        <section
            id="inscripcion"
            className="scroll-mt-24 bg-white pb-20 sm:pb-24 lg:pb-28"
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#0a2540_0%,#113a63_48%,#1e5fa8_100%)] px-6 py-12 text-center shadow-[0_40px_80px_-40px_rgba(10,37,64,0.65)] sm:px-10 sm:py-16">
                        <div
                            className="upel-grid absolute inset-0 opacity-60"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute -top-20 left-1/4 size-72 rounded-full bg-upel-gold/15 blur-[90px]"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute -right-16 -bottom-20 size-72 rounded-full bg-upel-blue/25 blur-[90px]"
                            aria-hidden="true"
                        />

                        <div className="relative mx-auto max-w-3xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[0.68rem] font-extrabold tracking-[0.16em] text-upel-gold-light uppercase backdrop-blur-sm">
                                {user ? 'Sesión Activa' : 'Admisión 2027'}
                            </span>

                            <h2 className="mt-5 font-display text-3xl leading-tight font-bold text-balance text-white sm:text-4xl lg:text-[2.9rem]">
                                {user
                                    ? `Bienvenido de nuevo, ${user.name}`
                                    : '¿Listo para ser parte de la UPEL?'}
                            </h2>

                            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty text-white/72 sm:text-lg">
                                {user
                                    ? 'Ya has iniciado sesión en el campus virtual. Accede a tu panel para consultar materias, notas y servicios académicos.'
                                    : canRegister
                                      ? 'Las preinscripciones están abiertas. Inicia tu proceso en línea y asegura tu cupo en la universidad de los educadores.'
                                      : `Las preinscripciones para el período 2027 abren el 2 de noviembre de 2026 a las 8:00 AM (GMT-4). Faltan ${remainingDays} días para comenzar tu camino docente.`}
                            </p>

                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                {!user && (
                                    <a
                                        href={
                                            canRegister
                                                ? admissionCreate.url()
                                                : '#carreras'
                                        }
                                        aria-disabled={!canRegister}
                                        onClick={(event) => {
                                            if (!canRegister) {
                                                event.preventDefault();
                                            }
                                        }}
                                        className={cn(
                                            'inline-flex items-center justify-center gap-2 rounded-[13px] px-7 py-3.5 text-sm font-extrabold transition-all duration-300',
                                            canRegister
                                                ? 'bg-upel-gold text-upel-navy shadow-[0_18px_40px_-18px_rgba(201,162,39,0.9)] hover:-translate-y-0.5 hover:bg-upel-gold-light'
                                                : 'cursor-not-allowed bg-white/12 text-white/45 ring-1 ring-white/15',
                                        )}
                                    >
                                        {canRegister
                                            ? 'Inicia tu preinscripción'
                                            : 'Preinscripciones cerradas'}
                                        <ArrowRight
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (user) {
                                            router.visit('/dashboard');
                                        } else {
                                            onLoginClick();
                                        }
                                    }}
                                    className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white/45 hover:bg-white/10"
                                >
                                    {user ? (
                                        <LayoutDashboard
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <LogIn
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {user
                                        ? 'Ir al Dashboard'
                                        : 'Acceder al portal'}
                                </button>
                            </div>

                            {!user && (
                                <p className="mt-5 text-[0.7rem] font-semibold text-white/45">
                                    ¿Ya eres estudiante? Ingresa con tu correo
                                    personal.
                                </p>
                            )}
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
