import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { UpelLogo } from '@/components/landing/brand';
import InputError from '@/components/input-error';
import PasswordField from '@/components/password-field';
import { update } from '@/routes/password';
import { login } from '@/routes';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

/**
 * Definición de la nueva contraseña para una cuenta ya creada.
 * Comparte la misma presentación que la página de inicio de sesión.
 */
export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Restablecer contraseña" />

            <div className="relative flex min-h-screen w-full items-center justify-center bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-4 sm:p-6 lg:p-8">
                <div
                    className="upel-grid pointer-events-none absolute inset-0 opacity-40"
                    aria-hidden="true"
                />

                <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_40px_100px_-30px_rgba(10,37,64,0.65)]">
                    <div className="relative bg-[linear-gradient(125deg,#0a2540_0%,#113a63_60%,#1e5fa8_100%)] px-6 pt-6 pb-7 text-white">
                        <div className="relative">
                            <Link
                                href={login()}
                                className="inline-block transition-opacity hover:opacity-85"
                            >
                                <UpelLogo variant="light" className="h-10" />
                            </Link>
                            <h1 className="mt-4 font-display text-2xl font-bold text-white">
                                Define tu contraseña
                            </h1>
                            <p className="mt-1 text-sm text-white/70">
                                Crea una contraseña segura para activar tu
                                cuenta del campus virtual.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-5">
                        <p className="rounded-xl bg-upel-cloud px-3.5 py-3 text-[0.72rem] leading-relaxed font-semibold text-upel-slate">
                            Por seguridad, el correo de la solicitud no se puede
                            cambiar desde aquí.
                        </p>

                        <Form
                            {...update.form()}
                            transform={(data) => ({ ...data, token, email })}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                        >
                            {({ processing, errors }) => (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-1.5 block text-[0.72rem] font-extrabold text-upel-navy"
                                        >
                                            Correo
                                        </label>
                                        <div className="relative">
                                            <Mail
                                                className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-upel-slate"
                                                aria-hidden="true"
                                            />
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                autoComplete="email"
                                                value={email}
                                                readOnly
                                                className="h-11 w-full cursor-not-allowed rounded-[11px] border border-upel-mist bg-upel-cloud pr-3 pl-9 text-sm font-medium text-upel-navy/70 focus:outline-none"
                                            />
                                        </div>
                                        <InputError
                                            message={errors.email}
                                            className="mt-1"
                                        />
                                    </div>

                                    <PasswordField
                                        id="password"
                                        name="password"
                                        label="Nueva contraseña"
                                        autoComplete="new-password"
                                        autoFocus
                                        required
                                        placeholder="••••••••"
                                        passwordrules={passwordRules}
                                        invalid={Boolean(errors.password)}
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="-mt-2"
                                    />

                                    <PasswordField
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        label="Confirmar contraseña"
                                        autoComplete="new-password"
                                        required
                                        placeholder="••••••••"
                                        passwordrules={passwordRules}
                                        invalid={Boolean(
                                            errors.password_confirmation,
                                        )}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                        className="-mt-2"
                                    />

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-test="reset-password-button"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-all duration-300 hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {processing ? (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <KeyRound
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {processing
                                            ? 'Guardando…'
                                            : 'Guardar contraseña'}
                                    </button>
                                </div>
                            )}
                        </Form>

                        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[0.62rem] font-semibold text-upel-slate/70">
                            <ShieldCheck
                                className="size-3"
                                aria-hidden="true"
                            />
                            Conexión segura · Datos protegidos
                        </p>

                        <div className="mt-3 border-t border-upel-mist pt-3 text-center">
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:text-upel-navy"
                            >
                                <ArrowLeft
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ResetPassword.layout = null;
