import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    GraduationCap,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { login as adminLogin } from '@/routes/admin';
import { store as loginStore } from '@/routes/login';
import { request as passwordRequest } from '@/routes/password';
import { UpelLogo } from '@/components/landing/brand';

type RoleTab = 'estudiante' | 'graduado' | 'profesor';

const tabs: {
    id: RoleTab;
    label: string;
    icon: typeof GraduationCap;
    description: string;
    submitLabel: string;
}[] = [
    {
        id: 'estudiante',
        label: 'Estudiante',
        icon: GraduationCap,
        description:
            'Accede al campus virtual si ya eres estudiante activo o si tu pre-inscripción fue aprobada. Consulta tus materias, notas y récord académico.',
        submitLabel: 'Ingresar como estudiante',
    },
    {
        id: 'graduado',
        label: 'Graduado',
        icon: BriefcaseBusiness,
        description:
            'Consulta tu récord, solicita constancias y mantén actualizados tus datos profesionales.',
        submitLabel: 'Ingresar como graduado',
    },
    {
        id: 'profesor',
        label: 'Profesor',
        icon: UserRound,
        description:
            'Gestiona tus asignaturas, planifica clases y registra las evaluaciones de tus estudiantes.',
        submitLabel: 'Ingresar como profesor',
    },
];

/**
 * Modal de acceso con tres perfiles. Reutiliza el login de Fortify,
 * por lo que la autenticación es real y segura.
 */
export function LoginModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [role, setRole] = useState<RoleTab>('estudiante');

    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
        portal: RoleTab;
    }>({
        email: '',
        password: '',
        remember: false,
        portal: 'estudiante',
    });

    const activeTab = tabs.find((tab) => tab.id === role) ?? tabs[0];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(loginStore.url(), {
            preserveScroll: true,
            onFinish: () => reset('password'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[24px] border-0 p-0 shadow-[0_40px_100px_-30px_rgba(10,37,64,0.65)] sm:max-w-md">
                <div className="relative overflow-hidden bg-[linear-gradient(125deg,#0a2540_0%,#113a63_60%,#1e5fa8_100%)] px-6 pt-6 pb-7">
                    <div
                        className="upel-grid absolute inset-0 opacity-60"
                        aria-hidden="true"
                    />
                    <div className="relative">
                        <UpelLogo variant="light" className="h-10" />
                        <DialogTitle className="mt-4 font-display text-2xl font-bold text-white">
                            Bienvenido de nuevo
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-white/65">
                            Ingresa con tu correo personal para continuar.
                        </DialogDescription>
                    </div>
                </div>

                <div className="bg-white">
                    <div
                        className="flex border-b border-upel-mist px-4 pt-3"
                        role="tablist"
                        aria-label="Tipo de usuario"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={role === tab.id}
                                aria-controls={`login-panel-${tab.id}`}
                                onClick={() => {
                                    setRole(tab.id);
                                    setData('portal', tab.id);
                                }}
                                className={cn(
                                    'relative flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-[0.72rem] font-extrabold transition-colors',
                                    role === tab.id
                                        ? 'text-upel-navy'
                                        : 'text-upel-slate hover:text-upel-navy',
                                )}
                            >
                                <tab.icon
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                {tab.label}
                                {role === tab.id && (
                                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-upel-gold" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div
                        id={`login-panel-${role}`}
                        role="tabpanel"
                        className="px-6 py-5"
                    >
                        <p className="rounded-xl bg-upel-cloud px-3.5 py-3 text-[0.72rem] leading-relaxed font-semibold text-upel-slate">
                            {activeTab.description}
                        </p>

                        <form onSubmit={submit} className="mt-4 space-y-4">
                            <div>
                                <label
                                    htmlFor="login-email"
                                    className="mb-1.5 block text-[0.72rem] font-extrabold text-upel-navy"
                                >
                                    Correo
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-upel-slate/60"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        required
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        placeholder="nombre@correo.com"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={
                                            errors.email
                                                ? 'login-email-error'
                                                : undefined
                                        }
                                        className="h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:outline-none"
                                    />
                                </div>
                                {errors.email && (
                                    <p
                                        id="login-email-error"
                                        className="mt-1 text-[0.68rem] font-semibold text-red-600"
                                    >
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <label
                                        htmlFor="login-password"
                                        className="text-[0.72rem] font-extrabold text-upel-navy"
                                    >
                                        Contraseña
                                    </label>
                                    <Link
                                        href={passwordRequest()}
                                        className="text-[0.68rem] font-bold text-upel-blue hover:text-upel-navy"
                                    >
                                        ¿La olvidaste?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <LockKeyhole
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-upel-slate/60"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="login-password"
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
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={
                                            errors.password
                                                ? 'login-password-error'
                                                : undefined
                                        }
                                        className="h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 pr-3 pl-9 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:outline-none"
                                    />
                                </div>
                                {errors.password && (
                                    <p
                                        id="login-password-error"
                                        className="mt-1 text-[0.68rem] font-semibold text-red-600"
                                    >
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-[0.72rem] font-semibold text-upel-slate">
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
                                    className="size-4 rounded border-upel-mist accent-upel-navy"
                                />
                                Mantener mi sesión iniciada
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-all duration-300 hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                            >
                                {processing ? (
                                    <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <ShieldCheck
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                )}
                                {processing
                                    ? 'Verificando…'
                                    : activeTab.submitLabel}
                            </button>
                        </form>

                        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[0.62rem] font-semibold text-upel-slate/70">
                            <ShieldCheck
                                className="size-3"
                                aria-hidden="true"
                            />
                            Conexión segura · Datos protegidos
                        </p>

                        <div className="mt-3 border-t border-upel-mist pt-3 text-center">
                            <Link
                                href={adminLogin()}
                                className="text-[0.65rem] font-bold text-upel-blue transition-colors hover:text-upel-navy"
                            >
                                ¿Personal administrativo? Acceso al portal
                                administrativo
                            </Link>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
