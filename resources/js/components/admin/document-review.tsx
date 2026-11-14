import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';

export type DocumentStatusOption = {
    value: string;
    label: string;
};

type Props = {
    documentId: number | string;
    actionUrl: string;
    statuses: DocumentStatusOption[];
    defaultOpen?: boolean;
};

/**
 * Formulario de revisión de un documento del expediente.
 */
export function DocumentReview({
    documentId,
    actionUrl,
    statuses,
    defaultOpen = false,
}: Props) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        status: statuses[0]?.value ?? 'validado',
        notes: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch(actionUrl, {
            preserveScroll: true,
            onSuccess: () => reset('notes'),
        });
    };

    return (
        <details className="group mt-3" open={defaultOpen}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Revisar documento
            </summary>

            <form
                onSubmit={submit}
                className="mt-3 space-y-3 rounded-xl bg-upel-cloud/60 p-4 dark:bg-muted/40"
            >
                <div>
                    <label
                        htmlFor={`review-status-${documentId}`}
                        className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                    >
                        Resultado
                    </label>
                    <select
                        id={`review-status-${documentId}`}
                        value={data.status}
                        onChange={(event) =>
                            setData('status', event.target.value)
                        }
                        className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-card"
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor={`review-notes-${documentId}`}
                        className="mb-1.5 block text-[0.65rem] font-bold text-foreground"
                    >
                        Observación{' '}
                        {data.status === 'rechazado' ? (
                            <span className="text-red-600">(obligatoria)</span>
                        ) : (
                            <span className="font-medium text-muted-foreground">
                                (opcional)
                            </span>
                        )}
                    </label>
                    <textarea
                        id={`review-notes-${documentId}`}
                        rows={2}
                        value={data.notes}
                        onChange={(event) =>
                            setData('notes', event.target.value)
                        }
                        required={data.status === 'rechazado'}
                        className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-medium text-foreground focus:border-upel-blue focus:outline-none dark:bg-card"
                        placeholder="Explica el motivo del rechazo o deja una nota interna."
                    />
                    <InputError
                        message={errors.notes as string | undefined}
                        className="mt-1 text-[0.68rem]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                >
                    {processing ? (
                        <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                        />
                    ) : (
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                    )}
                    Guardar revisión
                </button>
            </form>
        </details>
    );
}
