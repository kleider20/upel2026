import { useForm, usePage, router } from '@inertiajs/react';
import {
    ArrowUp,
    Clock3,
    Facebook,
    Instagram,
    LayoutDashboard,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Send,
    Youtube,
} from 'lucide-react';
import { store as subscribe } from '@/routes/newsletter';
import { ImpmLogo, UpelLogo } from '@/components/landing/brand';

const academicLinks = [
    { label: 'Pregrado', href: '#carreras' },
    { label: 'Postgrado', href: '#cursos' },
    { label: 'Educación continua', href: '#cursos' },
    { label: 'Campus virtual', href: '#online' },
    { label: 'Calendario académico', href: '#graduaciones' },
];

const universityLinks = [
    { label: 'Sobre la UPEL', href: '#nosotros' },
    { label: 'Autoridades', href: '#profesores' },
    { label: 'Núcleos e institutos', href: '#nosotros' },
    { label: 'Investigación', href: '#noticias' },
    { label: 'Transparencia', href: '#contacto' },
];

const legalLinks = [
    { label: 'Políticas de privacidad', href: '#contacto' },
    { label: 'Términos de uso', href: '#contacto' },
    { label: 'Accesibilidad', href: '#contacto' },
    { label: 'Mapa del sitio', href: '#inicio' },
];

const socialLinks = [
    {
        label: 'Facebook',
        href: 'https://facebook.com',
        icon: Facebook,
    },
    {
        label: 'Instagram',
        href: 'https://instagram.com',
        icon: Instagram,
    },
    {
        label: 'YouTube',
        href: 'https://youtube.com',
        icon: Youtube,
    },
];

/**
 * Pie de página con sellos institucionales, enlaces, contacto
 * y suscripción al boletín académico.
 */
export function Footer({ onLoginClick }: { onLoginClick: () => void }) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        recentlySuccessful,
        reset,
    } = useForm({ email: '' });

    return (
        <footer id="contacto" className="scroll-mt-24 bg-upel-navy text-white">
            <div className="mx-auto w-full max-w-[1280px] px-4 pt-16 pb-8 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
                    {/* Columna 1: identidad */}
                    <div>
                        <div className="flex flex-wrap gap-3">
                            <div className="w-[210px] rounded-2xl bg-white px-4 py-3 shadow-lg">
                                <UpelLogo className="h-11" />
                            </div>
                            <div className="w-[210px] rounded-2xl bg-white px-4 py-3 shadow-lg">
                                <ImpmLogo className="h-11" />
                            </div>
                        </div>

                        <p className="mt-5 max-w-sm text-[0.83rem] leading-relaxed text-white/60">
                            Universidad Pedagógica Experimental Libertador.
                            Formamos a los educadores que Venezuela necesita,
                            con excelencia académica, investigación y compromiso
                            social.
                        </p>

                        <div className="mt-5 flex items-center gap-2">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={social.label}
                                    className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-upel-gold hover:bg-upel-gold hover:text-upel-navy"
                                >
                                    <social.icon
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </a>
                            ))}
                            <a
                                href="https://x.com"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="X (Twitter)"
                                className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-upel-gold hover:bg-upel-gold hover:text-upel-navy"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="size-3.5"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.9 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.7L8.3 3.9H6.5L17.8 20Z" />
                                </svg>
                            </a>
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.05] p-4">
                            <p className="flex items-center gap-2 text-[0.7rem] font-extrabold tracking-wide text-upel-gold-light uppercase">
                                <Mail className="size-3.5" aria-hidden="true" />
                                Boletín académico
                            </p>
                            <p className="mt-1 text-[0.72rem] leading-relaxed text-white/55">
                                Novedades de admisión, cursos y eventos en tu
                                correo.
                            </p>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    post(subscribe.url(), {
                                        preserveScroll: true,
                                        onSuccess: () => reset(),
                                    });
                                }}
                                className="mt-3"
                            >
                                <label
                                    htmlFor="newsletter-email"
                                    className="sr-only"
                                >
                                    Correo electrónico
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="newsletter-email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        placeholder="tu@correo.com"
                                        autoComplete="email"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={
                                            errors.email
                                                ? 'newsletter-error'
                                                : undefined
                                        }
                                        className="h-10 w-full min-w-0 rounded-[10px] border border-white/15 bg-white/8 px-3 text-sm text-white placeholder:text-white/35 focus:border-upel-gold focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        aria-label="Suscribirme al boletín"
                                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-upel-gold text-upel-navy transition-colors hover:bg-upel-gold-light disabled:opacity-60"
                                    >
                                        {processing ? (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Send
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </div>

                                {errors.email && (
                                    <p
                                        id="newsletter-error"
                                        className="mt-2 text-[0.68rem] font-semibold text-[#ffb4b4]"
                                    >
                                        {errors.email}
                                    </p>
                                )}
                                {recentlySuccessful && (
                                    <p className="mt-2 text-[0.68rem] font-semibold text-[#7ce3c8]">
                                        ¡Suscripción confirmada! Gracias por
                                        acompañarnos.
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Columna 2: académicos */}
                    <nav aria-label="Enlaces académicos">
                        <h3 className="text-[0.7rem] font-extrabold tracking-[0.16em] text-upel-gold-light uppercase">
                            Académicos
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {academicLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-[0.83rem] font-semibold text-white/62 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Columna 3: universidad */}
                    <nav aria-label="Enlaces de la universidad">
                        <h3 className="text-[0.7rem] font-extrabold tracking-[0.16em] text-upel-gold-light uppercase">
                            Universidad
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {universityLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-[0.83rem] font-semibold text-white/62 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Columna 4: contacto */}
                    <div>
                        <h3 className="text-[0.7rem] font-extrabold tracking-[0.16em] text-upel-gold-light uppercase">
                            Contacto
                        </h3>
                        <ul className="mt-4 space-y-3.5 text-[0.8rem] font-semibold text-white/62">
                            <li className="flex items-start gap-2.5">
                                <MapPin
                                    className="mt-0.5 size-4 shrink-0 text-upel-gold"
                                    aria-hidden="true"
                                />
                                <span>
                                    Rectorado UPEL
                                    <br />
                                    Av. Universidad, Caracas, Venezuela
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone
                                    className="size-4 shrink-0 text-upel-gold"
                                    aria-hidden="true"
                                />
                                <a
                                    href="tel:+582120000000"
                                    className="transition-colors hover:text-white"
                                >
                                    +58 212 000 0000
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail
                                    className="size-4 shrink-0 text-upel-gold"
                                    aria-hidden="true"
                                />
                                <a
                                    href="mailto:admision@upel.edu.ve"
                                    className="transition-colors hover:text-white"
                                >
                                    admision@upel.edu.ve
                                </a>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <Clock3
                                    className="mt-0.5 size-4 shrink-0 text-upel-gold"
                                    aria-hidden="true"
                                />
                                <span>
                                    Lunes a viernes
                                    <br />
                                    8:00 AM - 4:00 PM
                                </span>
                            </li>
                        </ul>

                        <button
                            type="button"
                            onClick={() => {
                                const { auth } = usePage<{ auth: { user: any } }>().props;
                                const user = auth?.user;
                                if (user) {
                                    router.visit('/dashboard');
                                } else {
                                    onLoginClick();
                                }
                            }}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-upel-gold/60 hover:bg-white/8"
                        >
                            {(() => {
                                const { auth } = usePage<{ auth: { user: any } }>().props;
                                const user = auth?.user;
                                return (
                                    <>
                                        {user ? (
                                            <LayoutDashboard className="size-4" aria-hidden="true" />
                                        ) : null}
                                        {user ? 'Dashboard' : 'Iniciar sesión'}
                                    </>
                                );
                            })()}
                        </button>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[0.72rem] font-medium text-white/40">
                        © {new Date().getFullYear()} Universidad Pedagógica
                        Experimental Libertador. Todos los derechos reservados.
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {legalLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-[0.7rem] font-semibold text-white/40 transition-colors hover:text-white/80"
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href="#inicio"
                            aria-label="Volver arriba"
                            className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-upel-gold hover:text-upel-gold"
                        >
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
