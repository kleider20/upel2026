import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Eye,
    PencilLine,
    Plus,
    Printer,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { ToneBadge } from '@/components/portal/tone-badge';
import { EvaluationPlanSheet } from '@/components/professor/evaluation-plan-sheet';
import type { GradingLimits } from '@/lib/evaluation-plan';
import professorRoutes from '@/routes/professor';
import planRoutes from '@/routes/professor/plans';

type PlanItem = {
    id: number;
    position: number;
    title: string;
    content: string | null;
    weight: number;
    scheduled_on: string;
    scheduled_on_input: string;
};

type DateOption = {
    value: string;
    label: string;
};

type SheetHeader = {
    profesor: string;
    cedula: string | null;
    programa: string;
    sede: string;
    especialidad: string;
    especialidad_codigo: string | null;
    curso: string;
    periodo: string;
    periodo_activo: boolean;
    horario: string;
    ambiente: string;
    carrera: string;
    cohorte: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
};

type StudentRow = {
    student_id: number;
    enrollment_id: number | null;
    enrolled: boolean;
    student_name: string;
    student_code: string | null;
    id_number: string | null;
    semester: number | null;
    cohort: string | null;
    current_cohort: string | null;
    career_code: string | null;
    scores: Record<string, number | null>;
    definitive: number | null;
    definitive_ten: number | null;
    approved: boolean | null;
};

type Props = {
    plan: {
        id: number;
        subject_id: number;
        starts_on: string | null;
        ends_on: string | null;
        total_weight: number;
        remaining_weight: number;
        is_complete: boolean;
    };
    header: SheetHeader;
    items: PlanItem[];
    students: StudentRow[];
    date_options: DateOption[];
    limits: GradingLimits;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/**
 * Planilla del plan de evaluación con las notas y la definitiva al día.
 */
export default function EvaluationPlanShow({
    plan,
    header,
    items,
    students,
    date_options,
    limits,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState({
        title: '',
        content: '',
        weight: '',
        scheduled_on: '',
    });
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        if (!previewOpen) {
            return;
        }

        document.body.classList.add('evaluation-sheet-print');

        return () => document.body.classList.remove('evaluation-sheet-print');
    }, [previewOpen]);

    const usedDates = useMemo(
        () => new Set(items.map((item) => item.scheduled_on_input)),
        [items],
    );
    const availableDates = useMemo(
        () => date_options.filter((option) => !usedDates.has(option.value)),
        [date_options, usedDates],
    );

    const [newItem, setNewItem] = useState({
        title: '',
        content: '',
        weight: '',
        scheduled_on: availableDates[0]?.value ?? '',
    });

    const newItemDate = availableDates.some(
        (option) => option.value === newItem.scheduled_on,
    )
        ? newItem.scheduled_on
        : (availableDates[0]?.value ?? '');

    const editDateOptions = useMemo(() => {
        const item = items.find((current) => current.id === editingId);

        if (!item) {
            return date_options;
        }

        const usedByOthers = new Set(
            items
                .filter((current) => current.id !== item.id)
                .map((current) => current.scheduled_on_input),
        );
        const options = date_options.filter(
            (option) => !usedByOthers.has(option.value),
        );

        if (
            options.some((option) => option.value === item.scheduled_on_input)
        ) {
            return options;
        }

        return [
            ...options,
            {
                value: item.scheduled_on_input,
                label: `${item.scheduled_on} · fuera del horario`,
            },
        ];
    }, [date_options, editingId, items]);

    const startEditing = (item: PlanItem) => {
        setEditingId(item.id);
        setEditDraft({
            title: item.title,
            content: item.content ?? '',
            weight: String(item.weight),
            scheduled_on: item.scheduled_on_input,
        });
        setItemErrors({});
    };

    const saveItem = (item: PlanItem) => {
        router.put(
            planRoutes.items.update.url({ plan: plan.id, item: item.id }),
            editDraft,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingId(null);
                    setItemErrors({});
                },
                onError: (received) =>
                    setItemErrors(received as Record<string, string>),
            },
        );
    };

    const removeItem = (item: PlanItem) => {
        if (
            !window.confirm(
                `¿Eliminar la evaluación "${item.title}" y sus notas?`,
            )
        ) {
            return;
        }

        router.delete(
            planRoutes.items.destroy.url({ plan: plan.id, item: item.id }),
            {
                preserveScroll: true,
            },
        );
    };

    const addItem = () => {
        if (newItemDate === '') {
            return;
        }

        router.post(
            planRoutes.items.store.url({ plan: plan.id }),
            { ...newItem, scheduled_on: newItemDate },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewItem({
                        title: '',
                        content: '',
                        weight: '',
                        scheduled_on: '',
                    });
                    setCreating(false);
                    setItemErrors({});
                },
                onError: (received) =>
                    setItemErrors(received as Record<string, string>),
            },
        );
    };

    const headerFields: { label: string; value: string | null }[] = [
        { label: 'Profesor', value: header.profesor },
        { label: 'Cédula', value: header.cedula ?? 'Sin cédula registrada' },
        { label: 'Programa', value: header.programa },
        { label: 'Sede/Extensión', value: header.sede },
        { label: 'Especialidad', value: header.especialidad },
        { label: 'Curso', value: header.curso },
        { label: 'Período académico', value: header.periodo },
        { label: 'Horario', value: header.horario },
        { label: 'Ambiente', value: header.ambiente },
        { label: 'Cohorte', value: header.cohorte },
        { label: 'Fecha de inicio', value: header.fecha_inicio },
        { label: 'Fecha de fin', value: header.fecha_fin },
    ];

    return (
        <>
            <Head title={`Plan de evaluación · ${header.curso}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Planilla de evaluación"
                    title={header.curso}
                    description={`${header.especialidad} · Cohorte ${header.cohorte} · ${header.periodo}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90"
                            >
                                <Eye className="h-4 w-4" />
                                Vista previa
                            </button>
                            <Link
                                href={planRoutes.index.url()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Mis planes
                            </Link>
                        </div>
                    }
                />

                <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[0.62rem] font-bold tracking-[0.18em] text-upel-blue uppercase">
                                Universidad Pedagógica Experimental Libertador
                            </p>
                            <h2 className="mt-1 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                Plan de evaluación
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {plan.is_complete ? (
                                <ToneBadge tone="green">
                                    Ponderación completa
                                </ToneBadge>
                            ) : (
                                <ToneBadge tone="amber">
                                    Faltan {plan.remaining_weight} %
                                </ToneBadge>
                            )}
                            <span className="inline-flex h-9 items-center rounded-xl border border-border bg-upel-cloud/60 px-3 text-[0.7rem] font-bold text-upel-navy dark:bg-muted/40 dark:text-foreground">
                                Ambiente: {header.ambiente}
                            </span>
                        </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {headerFields.map((field) => (
                            <div
                                key={field.label}
                                className="rounded-xl bg-upel-cloud/50 px-3 py-2.5 dark:bg-muted/30"
                            >
                                <dt className="text-[0.62rem] font-bold tracking-wide text-muted-foreground uppercase">
                                    {field.label}
                                </dt>
                                <dd className="mt-1 text-xs font-bold text-upel-navy dark:text-foreground">
                                    {field.value ?? '—'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                Evaluaciones
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cada evaluación vale entre{' '}
                                {limits.min_item_weight} % y{' '}
                                {limits.max_item_weight} %. Total:{' '}
                                {plan.total_weight} % de {limits.total_weight}{' '}
                                %.
                            </p>
                            <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">
                                {date_options.length === 0
                                    ? 'Sin horario asignado: no es posible programar nuevas evaluaciones.'
                                    : availableDates.length === 0
                                      ? 'Todas las fechas del horario ya están asignadas a una evaluación.'
                                      : 'Las fechas corresponden a los días de clase del horario asignado a la materia y cada día se usa una sola vez.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setCreating((current) => !current);
                                setItemErrors({});
                            }}
                            disabled={
                                plan.remaining_weight <
                                    limits.min_item_weight ||
                                date_options.length === 0 ||
                                availableDates.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90 disabled:opacity-40"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar evaluación
                        </button>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-upel-cloud dark:bg-muted">
                        <div
                            className="h-full rounded-full bg-upel-blue"
                            style={{
                                width: `${Math.min(100, plan.total_weight)}%`,
                            }}
                        />
                    </div>

                    <div className="mt-5 space-y-3">
                        {items.length === 0 ? (
                            <EmptyState
                                icon={CalendarDays}
                                title="Sin evaluaciones"
                                description="Agrega la primera evaluación del plan para empezar a cargar notas."
                            />
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-border/70 px-4 py-3"
                                >
                                    {editingId === item.id ? (
                                        <div className="space-y-3">
                                            <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px]">
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Evaluación
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editDraft.title}
                                                        onChange={(event) =>
                                                            setEditDraft({
                                                                ...editDraft,
                                                                title: event
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                        className={inputClass}
                                                    />
                                                    <InputError
                                                        message={
                                                            itemErrors.title
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        Fecha
                                                    </label>
                                                    <select
                                                        value={
                                                            editDraft.scheduled_on
                                                        }
                                                        onChange={(event) =>
                                                            setEditDraft({
                                                                ...editDraft,
                                                                scheduled_on:
                                                                    event.target
                                                                        .value,
                                                            })
                                                        }
                                                        className={inputClass}
                                                    >
                                                        {editDateOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <InputError
                                                        message={
                                                            itemErrors.scheduled_on
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className={labelClass}
                                                    >
                                                        % de nota
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={
                                                            limits.min_item_weight
                                                        }
                                                        max={
                                                            limits.max_item_weight
                                                        }
                                                        value={editDraft.weight}
                                                        onChange={(event) =>
                                                            setEditDraft({
                                                                ...editDraft,
                                                                weight: event
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                        className={inputClass}
                                                    />
                                                    <InputError
                                                        message={
                                                            itemErrors.weight
                                                        }
                                                        className="mt-1 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={editDraft.content}
                                                onChange={(event) =>
                                                    setEditDraft({
                                                        ...editDraft,
                                                        content:
                                                            event.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-muted/40"
                                                placeholder="Contenido de la evaluación"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingId(null)
                                                    }
                                                    className="rounded-lg border border-border px-3 py-2 text-[0.68rem] font-bold text-muted-foreground hover:bg-upel-cloud dark:hover:bg-muted"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        saveItem(item)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-bold text-white hover:bg-upel-navy/90"
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-upel-navy dark:text-foreground">
                                                    {item.position}.{' '}
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 text-[0.7rem] font-semibold text-muted-foreground">
                                                    {item.scheduled_on} ·{' '}
                                                    {item.weight} % de la nota
                                                </p>
                                                {item.content ? (
                                                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                                                        {item.content}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEditing(item)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.66rem] font-bold text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                >
                                                    <PencilLine className="h-3.5 w-3.5" />
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(item)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.66rem] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {creating ? (
                        <div className="mt-4 rounded-xl border border-dashed border-upel-blue/40 bg-upel-cloud/40 p-4 dark:bg-muted/20">
                            <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px]">
                                <div>
                                    <label className={labelClass}>
                                        Evaluación
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.title}
                                        onChange={(event) =>
                                            setNewItem({
                                                ...newItem,
                                                title: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                        placeholder="Taller, prueba escrita…"
                                    />
                                    <InputError
                                        message={itemErrors.title}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha</label>
                                    {date_options.length === 0 ? (
                                        <div className="flex h-10 w-full items-center rounded-xl border border-dashed border-amber-500/50 bg-amber-50 px-3 text-[0.7rem] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                            Sin horario asignado
                                        </div>
                                    ) : availableDates.length === 0 ? (
                                        <div className="flex h-10 w-full items-center rounded-xl border border-dashed border-amber-500/50 bg-amber-50 px-3 text-[0.7rem] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                            Sin fechas disponibles
                                        </div>
                                    ) : (
                                        <select
                                            value={newItemDate}
                                            onChange={(event) =>
                                                setNewItem({
                                                    ...newItem,
                                                    scheduled_on:
                                                        event.target.value,
                                                })
                                            }
                                            className={inputClass}
                                        >
                                            {availableDates.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <InputError
                                        message={itemErrors.scheduled_on}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        % de nota
                                    </label>
                                    <input
                                        type="number"
                                        min={limits.min_item_weight}
                                        max={Math.min(
                                            limits.max_item_weight,
                                            plan.remaining_weight,
                                        )}
                                        value={newItem.weight}
                                        onChange={(event) =>
                                            setNewItem({
                                                ...newItem,
                                                weight: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                    <InputError
                                        message={itemErrors.weight}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>
                            <textarea
                                rows={2}
                                value={newItem.content}
                                onChange={(event) =>
                                    setNewItem({
                                        ...newItem,
                                        content: event.target.value,
                                    })
                                }
                                className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground focus:border-upel-blue focus:outline-none dark:bg-muted/40"
                                placeholder="Contenido de la evaluación"
                            />
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCreating(false)}
                                    className="rounded-lg border border-border px-3 py-2 text-[0.68rem] font-bold text-muted-foreground hover:bg-upel-cloud dark:hover:bg-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    disabled={newItemDate === ''}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-upel-navy px-3 py-2 text-[0.68rem] font-bold text-white hover:bg-upel-navy/90 disabled:opacity-40"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-upel-blue/20 bg-upel-blue/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold tracking-wide text-upel-blue uppercase">
                                Notas por evaluación
                            </p>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                                Las notas de cada estudiante en las{' '}
                                {items.length} evaluaciones del plan se cargan
                                en la página Cargar notas. Aquí solo se
                                administra el plan y se genera la vista previa.
                            </p>
                        </div>
                        <Link
                            href={professorRoutes.grades.index.url({
                                query: { materia: plan.subject_id },
                            })}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90"
                        >
                            <PencilLine className="h-4 w-4" />
                            Ir a cargar notas
                        </Link>
                    </div>
                </section>
            </div>

            {previewOpen
                ? createPortal(
                      <div className="evaluation-sheet-modal fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-upel-navy/70 p-4 backdrop-blur-sm">
                          <div className="evaluation-sheet-modal-card w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3 print:hidden">
                                  <div>
                                      <p className="text-[0.62rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                          Vista previa del documento
                                      </p>
                                      <p className="text-xs font-bold text-upel-navy">
                                          Plan de evaluación · {header.curso}
                                      </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                      <button
                                          type="button"
                                          onClick={() => window.print()}
                                          className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy/90"
                                      >
                                          <Printer className="h-4 w-4" />
                                          Imprimir / Guardar PDF
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => setPreviewOpen(false)}
                                          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy transition-colors hover:bg-upel-cloud"
                                      >
                                          <X className="h-4 w-4" />
                                          Cerrar
                                      </button>
                                  </div>
                              </div>
                              <div className="evaluation-sheet-scroll max-h-[80vh] overflow-y-auto bg-upel-cloud/50 p-4 print:max-h-none print:overflow-visible print:bg-white">
                                  <EvaluationPlanSheet
                                      header={header}
                                      items={items}
                                      rows={students}
                                      totalWeight={plan.total_weight}
                                      limits={limits}
                                  />
                              </div>
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
}
