import { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpelLogo } from '@/components/landing/brand';
import { create as admissionCreate } from '@/routes/admissions';

const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Carreras', href: '#carreras' },
    { label: 'Online', href: '#online' },
    { label: 'Cursos', href: '#cursos' },
    { label: 'Profesores', href: '#profesores' },
    { label: 'Noticias', href: '#noticias' },
    { label: 'Graduaciones', href: '#graduaciones' },
];

function daysUntil(target: string): number {
    const difference = new Date(target).getTime() - Date.now();

    return Math.max(0, Math.ceil(difference / 86_400_000));
}

export function Navbar({
    onLoginClick,
    canRegister,
    registrationOpensAt,
}: {
    onLoginClick: () => void;
    canRegister: boolean;
    registrationOpensAt: string;
}) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const user = auth?.user;
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const solid = scrolled || mobileOpen;
    const remainingDays = daysUntil(registrationOpensAt);

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-40 transition-all duration-300',
                solid
                    ? 'border-b border-upel-navy/8 bg-white/92 text-upel-navy shadow-[0_10px_40px_-24px_rgba(10,37,64,0.45)] backdrop-blur-xl'
                    : 'bg-transparent text-white',
            )}
        >
            <nav
                className="mx-auto flex h-[74px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
                aria-label="Navegación principal"
            >
                <a
                    href="#inicio"
                    className="flex shrink-0 items-center rounded-lg"
                    aria-label="UPEL, ir al inicio"
                >
                    <UpelLogo
                        variant={solid ? 'dark' : 'light'}
                        className="h-10 sm:h-11"
                    />
                </a>

                <ul className="hidden items-center gap-1 xl:flex">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className={cn(
                                    'rounded-full px-3 py-2 text-[0.83rem] font-bold transition-colors duration-300',
                                    solid
                                        ? 'text-upel-navy/78 hover:bg-upel-navy/5 hover:text-upel-navy'
                                        : 'text-white/82 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
                    <button
                        type="button"
                        onClick={() => {
                            if (user) {
                                router.visit('/dashboard');
                            } else {
                                onLoginClick();
                            }
                        }}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-[13px] border px-4 py-2.5 text-sm font-bold transition-all duration-300',
                            solid
                                ? 'border-upel-navy/15 text-upel-navy hover:border-upel-navy/30 hover:bg-upel-navy/5'
                                : 'border-white/25 text-white hover:border-white/45 hover:bg-white/10',
                        )}
                    >
                        {user ? (
                            <LayoutDashboard className="size-4" aria-hidden="true" />
                        ) : (
                            <LogIn className="size-4" aria-hidden="true" />
                        )}
                        {user ? 'Dashboard' : 'Iniciar sesión'}
                    </button>

                    {!user && (
                        <div className="group relative">
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
                                    'inline-flex items-center gap-2 rounded-[13px] px-5 py-2.5 text-sm font-extrabold shadow-[0_10px_24px_-12px_rgba(201,162,39,0.8)] transition-all duration-300',
                                    canRegister
                                        ? 'bg-upel-gold text-upel-navy hover:-translate-y-0.5 hover:bg-upel-gold-light'
                                        : 'cursor-not-allowed bg-upel-gold/45 text-upel-navy/60',
                                )}
                            >
                                Inscríbete
                                <span aria-hidden="true">→</span>
                            </a>

                            <div
                                role="tooltip"
                                className="pointer-events-none absolute top-full right-0 z-50 mt-3 w-72 translate-y-1 rounded-xl bg-upel-navy px-4 py-3 text-left text-xs leading-relaxed text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                            >
                                <span className="mb-1 flex items-center gap-2 font-extrabold text-upel-gold-light">
                                    {canRegister
                                        ? 'Inscripciones abiertas'
                                        : 'Inscripciones cerradas'}
                                </span>
                                {canRegister
                                    ? 'Ya puedes iniciar tu proceso de preinscripción en línea.'
                                    : `Las preinscripciones abren el 2 de noviembre de 2026 a las 8:00 AM (GMT-4). Faltan ${remainingDays} días.`}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className={cn(
                        'inline-flex size-11 items-center justify-center rounded-xl border transition-colors lg:hidden',
                        solid
                            ? 'border-upel-navy/12 text-upel-navy hover:bg-upel-navy/5'
                            : 'border-white/25 text-white hover:bg-white/10',
                    )}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-menu"
                    aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                    onClick={() => setMobileOpen((open) => !open)}
                >
                    {mobileOpen ? (
                        <X className="size-5" aria-hidden="true" />
                    ) : (
                        <Menu className="size-5" aria-hidden="true" />
                    )}
                </button>
            </nav>

            {/* Menú móvil */}
            <div
                id="mobile-menu"
                className={cn(
                    'overflow-hidden border-t border-upel-navy/8 bg-white transition-[max-height,opacity] duration-300 lg:hidden',
                    mobileOpen
                        ? 'max-h-[calc(100dvh-74px)] opacity-100'
                        : 'max-h-0 opacity-0',
                )}
            >
                <div className="mx-auto flex max-h-[calc(100dvh-74px)] w-full max-w-[1280px] flex-col gap-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-xl px-4 py-3 text-sm font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                        >
                            {link.label}
                        </a>
                    ))}

                    <div className="mt-3 grid gap-2 border-t border-upel-navy/8 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileOpen(false);
                                if (user) {
                                    router.visit('/dashboard');
                                } else {
                                    onLoginClick();
                                }
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-upel-navy/15 px-4 py-3 text-sm font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                        >
                            {user ? (
                                <LayoutDashboard className="size-4" aria-hidden="true" />
                            ) : (
                                <LogIn className="size-4" aria-hidden="true" />
                            )}
                            {user ? 'Dashboard' : 'Iniciar sesión'}
                        </button>

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

                                        return;
                                    }

                                    setMobileOpen(false);
                                }}
                                className={cn(
                                    'inline-flex items-center justify-center gap-2 rounded-[13px] px-4 py-3 text-sm font-extrabold',
                                    canRegister
                                        ? 'bg-upel-gold text-upel-navy'
                                        : 'cursor-not-allowed bg-upel-gold/45 text-upel-navy/60',
                                )}
                            >
                                Inscríbete
                            </a>
                        )}

                        <p className="px-2 pt-1 text-center text-[0.7rem] leading-relaxed text-upel-slate">
                            {user
                                ? 'Sesión activa en el campus virtual.'
                                : canRegister
                                  ? 'Preinscripciones abiertas en línea.'
                                  : `Preinscripciones abren el 2 de noviembre de 2026. Faltan ${remainingDays} días.`}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
