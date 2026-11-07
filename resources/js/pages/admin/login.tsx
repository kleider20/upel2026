import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { UpelLogo } from '@/components/landing/brand';
import { store as loginStore } from '@/routes/login';
import { landing } from '@/routes';

type Props = {
    status?: string;
};

/**
 * Acceso exclusivo del personal administrativo de la UPEL.
 */
export default function AdminLogin({ status }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        portal: 'admin',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(loginStore.url(), {
            preserveScroll: true,
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Acceso administrativo" />

            <div className="grid min-h-screen bg-upel-cloud lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-[linear-gradient(140deg,#071b2f_0%,#0a2540_45%,#174a7c_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
                    <div
                        className="upel-grid absolute inset-0 opacity-50"
                        aria-hidden="true"
                    />
                    <div className="relative">
                        <UpelLogo variant="light" className="h-12" />

                        <p className="mt-16 text-[0.68rem] font-bold tracking-[0.22em] text-upel-gold-light uppercase">
                            Gestión institucional
                        </p>
                        <h1 className="mt-3 max-w-lg font-display text-4xl leading-tight font-bold xl:text-5xl">
                            Portal administrativo de la UPEL
                        </h1>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                            Espacio reservado para decanos, coordinadores
                            académicos y personal administrativo. Administra la
                            información académica y financiera de la universidad
                            desde un solo lugar.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                'Supervisión académica y de notas',
                                'Gestión de carreras, materias y profesores',
                                'Control financiero y de pagos estudiantiles',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 text-sm font-semibold text-white/80"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                                        <ShieldCheck className="h-3.5 w-3.5 text-upel-gold-light" />
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-upel-gold/15 text-upel-gold-light">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-bold tracking-wide uppercase">
                                Universidad Pedagógica Experimental Libertador
                            </p>
                            <p className="mt-0.5 text-[0.68rem] text-white/50">
                                Vicerrectorado de Docencia · Unidad de Currículo
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                            <span className="flex h-12 items-center rounded-xl bg-white px-3 shadow-sm ring-1 ring-black/5">
                                <UpelLogo className="h-8" />
                            </span>
                            <Link
                                href={landing.url()}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-upel-blue"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver
                            </Link>
                        </div>

                        <div className="rounded-[26px] border border-border/70 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(10,37,64,0.35)] sm:p-8 dark:bg-card">
                            <span className="inline-flex items-center gap-2 rounded-full bg-upel-navy/5 px-3 py-1 text-[0.62rem] font-bold tracking-[0.16em] text-upel-navy uppercase ring-1 ring-upel-navy/10 dark:text-foreground">
                                <ShieldCheck className="h-3 w-3" />
                                Acceso restringido
                            </span>

                            <h2 className="mt-5 font-display text-3xl font-bold text-upel-navy dark:text-foreground">
                                Iniciar sesión
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Ingresa con tu correo institucional asignado por
                                la coordinación administrativa.
                            </p>

                            {status ? (
                                <p className="mt-4 rounded-xl bg-upel-green/10 px-3 py-2 text-xs font-semibold text-upel-green">
                                    {status}
                                </p>
                            ) : null}

                            <form onSubmit={submit} className="mt-6 space-y-4">
                                <div>
                                    <label
                                        htmlFor="admin-email"
                                        className="mb-1.5 block text-xs font-bold text-upel-navy dark:text-foreground"
                                    >
                                        Correo
                                    </label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="admin-email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="nombre@upel.edu.ve"
                                            aria-invalid={Boolean(errors.email)}
                                            className="h-11 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-muted-foreground/60 focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-background"
                                        />
                                    </div>
                                    {errors.email ? (
                                        <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                            {errors.email}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label
                                        htmlFor="admin-password"
                                        className="mb-1.5 block text-xs font-bold text-upel-navy dark:text-foreground"
                                    >
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="admin-password"
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(event) =>
                                                setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="••••••••"
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                            className="h-11 w-full rounded-xl border border-border bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-muted-foreground/60 focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-background"
                                        />
                                    </div>
                                    {errors.password ? (
                                        <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                            {errors.password}
                                        </p>
                                    ) : null}
                                </div>

                                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(event) =>
                                            setData(
                                                'remember',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-border accent-upel-navy"
                                    />
                                    Mantener mi sesión iniciada
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="h-4 w-4" />
                                    )}
                                    {processing
                                        ? 'Verificando…'
                                        : 'Entrar al portal'}
                                </button>
                            </form>

                            <div className="mt-6 border-t border-border pt-4 text-center">
                                <Link
                                    href={landing.url()}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-upel-blue transition-colors hover:text-upel-navy"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Volver al portal web
                                </Link>
                            </div>
                        </div>

                        <p className="mt-5 text-center text-[0.65rem] leading-relaxed font-semibold text-muted-foreground">
                            Si no recuerdas tus credenciales, contacta a la
                            coordinación administrativa de la UPEL.
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}
