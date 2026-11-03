import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarClock, FileSearch, GraduationCap } from 'lucide-react';
import { lookup as admissionLookup } from '@/routes/admissions';

type Props = {
    opensAt: string;
    remainingDays: number;
    periodYear: number;
};

/**
 * Pantalla que se muestra cuando la ventana de preinscripción aún no abre.
 */
export default function AdmissionClosed({
    opensAt,
    remainingDays,
    periodYear,
}: Props) {
    const formattedDate = new Intl.DateTimeFormat('es-VE', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Caracas',
    }).format(new Date(opensAt));

    return (
        <>
            <Head title="Preinscripción cerrada" />

            <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="overflow-hidden rounded-3xl border border-upel-navy/10 bg-white shadow-[0_30px_70px_-45px_rgba(10,37,64,0.45)]">
                    <div className="relative bg-[linear-gradient(125deg,#071b30_0%,#0a2540_45%,#113a63_100%)] px-6 py-10 text-center sm:px-10">
                        <div
                            className="upel-grid absolute inset-0 opacity-60"
                            aria-hidden="true"
                        />
                        <div className="relative">
                            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-upel-gold text-upel-navy">
                                <CalendarClock
                                    className="size-7"
                                    aria-hidden="true"
                                />
                            </span>
                            <h1 className="mt-5 font-display text-3xl leading-tight font-bold text-white sm:text-4xl">
                                La preinscripción abre pronto
                            </h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                                El formulario en línea para la convocatoria{' '}
                                {periodYear} se habilitará automáticamente el{' '}
                                <strong className="font-bold text-upel-gold-light">
                                    {formattedDate}
                                </strong>{' '}
                                (hora de Venezuela, GMT-4).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 px-6 py-8 sm:px-10">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-upel-navy/10 bg-upel-cloud/60 p-5 text-center">
                                <p className="font-display text-4xl leading-none font-bold text-upel-navy">
                                    {remainingDays}
                                </p>
                                <p className="mt-1 text-[0.65rem] font-bold tracking-[0.14em] text-upel-slate uppercase">
                                    {remainingDays === 1
                                        ? 'día restante'
                                        : 'días restantes'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-upel-navy/10 bg-upel-cloud/60 p-5 text-center">
                                <p className="font-display text-4xl leading-none font-bold text-upel-navy">
                                    {periodYear}
                                </p>
                                <p className="mt-1 text-[0.65rem] font-bold tracking-[0.14em] text-upel-slate uppercase">
                                    período de admisión
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-upel-gold/30 bg-upel-gold/8 p-5">
                            <p className="flex items-center gap-2 text-xs font-extrabold text-upel-navy">
                                <GraduationCap
                                    className="size-4 text-upel-gold"
                                    aria-hidden="true"
                                />
                                Mientras tanto, puedes preparar tus documentos
                            </p>
                            <ul className="mt-3 space-y-1.5 text-[0.72rem] leading-relaxed text-upel-slate">
                                <li>• Título de bachiller o fondo negro.</li>
                                <li>
                                    • Notas certificadas de 1.º a 5.º año,
                                    firmadas y selladas.
                                </li>
                                <li>
                                    • Cédula de identidad vigente (ambas caras en
                                    un solo archivo).
                                </li>
                                <li>
                                    • Fotografía reciente tipo carnet, fondo
                                    blanco.
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-upel-navy/15 px-5 py-3 text-sm font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                            >
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                Volver al sitio
                            </Link>
                            <Link
                                href={admissionLookup()}
                                className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-upel-navy-800"
                            >
                                <FileSearch
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Consultar una solicitud existente
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
