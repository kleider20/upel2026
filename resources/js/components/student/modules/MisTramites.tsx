import { useForm, usePage } from '@inertiajs/react';
import { FileText, Send } from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { StudentDashboardProps } from '@/types/student';
import { store as storeTramite } from '@/routes/student/tramites';

export function MisTramites({ tramites }: StudentDashboardProps) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;

    const { data, setData, post, processing, reset } = useForm({
        type: 'constancia_estudios',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(storeTramite.url(), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                    Servicios estudiantiles
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                    Mis Trámites y Constancias Académicas
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Solicita documentos oficiales con firma digital y
                    verificación institucional de la UPEL.
                </p>
            </div>

            {flash?.success && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {flash.success}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Formulario de solicitud */}
                <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                    <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">
                        Solicitar Nuevo Trámite
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Selecciona el tipo de documento que requieres emitir.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">
                                Tipo de documento
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) =>
                                    setData('type', e.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-bold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                            >
                                <option value="constancia_estudios">
                                    Constancia de Estudios
                                </option>
                                <option value="constancia_notas">
                                    Constancia de Notas (Récord)
                                </option>
                                <option value="solvencia">
                                    Solvencia Institucional
                                </option>
                                <option value="record_academico">
                                    Récord Académico Certificado
                                </option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-upel-navy px-4 py-3 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {processing
                                ? 'Enviando solicitud...'
                                : 'Enviar Solicitud'}
                        </button>
                    </form>
                </div>

                {/* Historial de solicitudes */}
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm lg:col-span-2 dark:bg-card">
                    <div className="border-b border-border px-6 py-4">
                        <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">
                            Historial de Trámites Solicitados
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Seguimiento en tiempo real del estatus de tus
                            documentos.
                        </p>
                    </div>

                    {tramites.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                                No tienes trámites solicitados
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {tramites.map((t: any) => (
                                <div
                                    key={t.id}
                                    className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-upel-navy dark:text-foreground">
                                            {t.type_label}
                                        </p>
                                        <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                                            Solicitado el {t.created_at}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ToneBadge tone={t.status_tone as Tone}>
                                            {t.status_label}
                                        </ToneBadge>
                                        {t.status === 'aprobado' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    alert(
                                                        `Descargando documento ${t.type_label}...`,
                                                    )
                                                }
                                                className="rounded-lg border border-border px-3 py-1 text-[0.7rem] font-bold text-upel-blue hover:bg-upel-cloud dark:hover:bg-muted"
                                            >
                                                Descargar PDF
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
