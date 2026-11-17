import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarDays,
    Loader2,
    Save,
    ShieldCheck,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { update as updateAdmissionWindow } from '@/routes/admin/inscripciones';

export type AdmissionWindowData = {
    opens_on: string;
    closes_on: string;
    mode: 'automatic' | 'open' | 'closed';
    is_open: boolean;
    status_label: string;
    status_tone: string;
    detail: string;
    can_manage: boolean;
};

type WindowMode = AdmissionWindowData['mode'];

type AdmissionWindowFormData = {
    opens_on: string;
    closes_on: string;
    mode: WindowMode;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

const modeOptions: { value: WindowMode; label: string; hint: string }[] = [
    {
        value: 'automatic',
        label: 'Automático',
        hint: 'Según las fechas',
    },
    {
        value: 'open',
        label: 'Abiertas',
        hint: 'Forzar apertura',
    },
    {
        value: 'closed',
        label: 'Cerradas',
        hint: 'Forzar cierre',
    },
];

/**
 * Tarjeta del panel administrativo para habilitar o deshabilitar las
 * inscripciones y definir su rango de fechas.
 */
export function AdmissionWindowPanel({
    admissionWindow,
}: {
    admissionWindow: AdmissionWindowData;
}) {
    const form = useForm<AdmissionWindowFormData>({
        opens_on: admissionWindow.opens_on,
        closes_on: admissionWindow.closes_on,
        mode: admissionWindow.mode,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.put(updateAdmissionWindow.url(), { preserveScroll: true });
    };

    return (
        <section
            aria-label="Ventana de inscripciones"
            className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card"
        >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-upel-navy/5 text-upel-navy ring-1 ring-upel-navy/10 dark:bg-white/5 dark:text-foreground">
                        <CalendarClock className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-[0.68rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                            Admisión en línea
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                            Ventana de inscripciones
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {admissionWindow.detail}
                        </p>
                    </div>
                </div>

                <ToneBadge
                    tone={admissionWindow.status_tone as Tone}
                    className="self-start"
                >
                    {admissionWindow.status_label}
                </ToneBadge>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="opens_on" className={labelClass}>
                            Fecha de inicio
                        </label>
                        <div className="relative">
                            <CalendarDays
                                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                id="opens_on"
                                type="date"
                                value={form.data.opens_on}
                                onChange={(event) =>
                                    form.setData('opens_on', event.target.value)
                                }
                                className={cn(inputClass, 'pl-9')}
                                required
                            />
                        </div>
                        <InputError
                            message={form.errors.opens_on}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label htmlFor="closes_on" className={labelClass}>
                            Fecha de cierre
                        </label>
                        <div className="relative">
                            <CalendarDays
                                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                id="closes_on"
                                type="date"
                                value={form.data.closes_on}
                                min={form.data.opens_on}
                                onChange={(event) =>
                                    form.setData(
                                        'closes_on',
                                        event.target.value,
                                    )
                                }
                                className={cn(inputClass, 'pl-9')}
                                required
                            />
                        </div>
                        <InputError
                            message={form.errors.closes_on}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div>
                    <span className={labelClass}>
                        Estado de las inscripciones
                    </span>
                    <div
                        role="group"
                        aria-label="Estado de las inscripciones"
                        className="grid gap-2 sm:grid-cols-3"
                    >
                        {modeOptions.map((option) => {
                            const active = form.data.mode === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() =>
                                        form.setData('mode', option.value)
                                    }
                                    className={cn(
                                        'rounded-xl border px-3 py-2.5 text-left transition-colors',
                                        active
                                            ? 'border-upel-navy bg-upel-navy text-white'
                                            : 'border-border bg-upel-cloud/40 text-upel-navy hover:border-upel-blue/40 dark:bg-muted/30 dark:text-foreground',
                                    )}
                                >
                                    <span className="block text-xs font-bold">
                                        {option.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'mt-0.5 block text-[0.62rem] font-semibold',
                                            active
                                                ? 'text-white/70'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {option.hint}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <InputError message={form.errors.mode} className="mt-1" />
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                    <p className="flex items-start gap-2 text-[0.68rem] leading-relaxed font-semibold text-muted-foreground">
                        <ShieldCheck
                            className="mt-0.5 size-3.5 shrink-0 text-upel-green"
                            aria-hidden="true"
                        />
                        Al finalizar la fecha de cierre las inscripciones se
                        deshabilitan automáticamente. El administrador y el
                        decano pueden cerrarlas o reabrirlas manualmente.
                    </p>

                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {form.processing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        Guardar cambios
                    </button>
                </div>
            </form>
        </section>
    );
}
