import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, Inbox, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import {
    type Tone,
    ToneBadge,
    toneClasses,
} from '@/components/portal/tone-badge';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';

type Column = {
    key: string;
    label: string;
};

type Row = {
    id: number;
    cells: Record<string, string | number | null>;
    tones?: Record<string, string>;
    url?: string;
    review?: {
        count: number;
        labels: string[];
    } | null;
    actions?: {
        view_url: string;
        edit_url?: string;
        delete_url?: string;
        student_name: string;
    } | null;
};

type Stat = {
    label: string;
    value: string;
    tone: Tone;
};

type Props = {
    module: string;
    title: string;
    description: string;
    columns: Column[];
    rows: Row[];
    stats: Stat[];
};

/**
 * Vista genérica de los listados del portal administrativo.
 */
export default function AdminResource({
    title,
    description,
    columns,
    rows,
    stats,
}: Props) {
    const hasActions = columns.some((column) => column.key === 'actions');

    const deleteStudent = (row: Row) => {
        if (!row.actions?.delete_url) {
            return;
        }

        if (
            !window.confirm(
                `¿Eliminar permanentemente la cuenta de ${row.actions.student_name}? También se eliminarán su perfil, inscripciones y pagos. La solicitud de admisión permanecerá como registro histórico.`,
            )
        ) {
            return;
        }

        router.delete(row.actions.delete_url);
    };

    return (
        <>
            <Head title={title} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Módulo administrativo"
                    title={title}
                    description={description}
                    actions={
                        <Link
                            href={adminDashboard()}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver al panel
                        </Link>
                    }
                />

                {stats.length > 0 ? (
                    <section
                        aria-label={`Resumen de ${title}`}
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card"
                            >
                                <p className="text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                    {stat.label}
                                </p>
                                <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                                    {stat.value}
                                </p>
                                <span
                                    className={cn(
                                        'mt-3 inline-flex h-1.5 w-10 rounded-full',
                                        toneClasses[stat.tone] ??
                                            toneClasses.blue,
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                        ))}
                    </section>
                ) : null}

                <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <div>
                            <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                Registros
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {rows.length} resultado
                                {rows.length === 1 ? '' : 's'} encontrados
                            </p>
                        </div>
                        <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-muted-foreground ring-1 ring-border dark:bg-muted">
                            {hasActions
                                ? 'Gestión de estudiantes'
                                : 'Solo lectura'}
                        </span>
                    </div>

                    {rows.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={Inbox}
                                title="Sin registros"
                                description="Todavía no hay información disponible en este módulo."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table
                                className={`w-full ${hasActions ? 'min-w-[900px]' : 'min-w-[760px]'} border-collapse text-left text-sm`}
                            >
                                <thead>
                                    <tr className="bg-upel-cloud/70 dark:bg-muted/50">
                                        {columns.map((column) => (
                                            <th
                                                key={column.key}
                                                scope="col"
                                                className="px-5 py-3 text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase"
                                            >
                                                {column.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition-colors hover:bg-upel-cloud/50 dark:hover:bg-muted/30"
                                        >
                                            {columns.map((column) => {
                                                const reviewCount =
                                                    row.review?.count ?? 0;
                                                const reviewLabels =
                                                    row.review?.labels ?? [];

                                                if (column.key === 'actions') {
                                                    return (
                                                        <td
                                                            key={column.key}
                                                            className="px-5 py-3.5 align-middle"
                                                        >
                                                            {row.actions ? (
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <Link
                                                                        href={
                                                                            row
                                                                                .actions
                                                                                .view_url
                                                                        }
                                                                        aria-label={
                                                                            reviewCount >
                                                                            0
                                                                                ? `Ver perfil de ${row.actions.student_name}: ${reviewCount} solicitud${reviewCount === 1 ? '' : 'es'} de revisión pendiente${reviewCount === 1 ? '' : 's'}`
                                                                                : `Ver perfil de ${row.actions.student_name}`
                                                                        }
                                                                        title={
                                                                            reviewCount >
                                                                            0
                                                                                ? `Solicitudes pendientes: ${reviewLabels.join(', ')}`
                                                                                : 'Ver perfil'
                                                                        }
                                                                        className="relative inline-flex size-8 items-center justify-center rounded-lg border border-border text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted"
                                                                    >
                                                                        <Eye className="size-3.5" />
                                                                        {reviewCount >
                                                                        0 ? (
                                                                            <span className="absolute -top-1.5 -right-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[0.6rem] font-extrabold text-white">
                                                                                {reviewCount >
                                                                                9
                                                                                    ? '9+'
                                                                                    : reviewCount}
                                                                            </span>
                                                                        ) : null}
                                                                    </Link>
                                                                    {row.actions
                                                                        .edit_url ? (
                                                                        <Link
                                                                            href={
                                                                                row
                                                                                    .actions
                                                                                    .edit_url
                                                                            }
                                                                            aria-label={`Editar perfil de ${row.actions.student_name}`}
                                                                            title="Editar perfil"
                                                                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                                        >
                                                                            <Pencil className="size-3.5" />
                                                                        </Link>
                                                                    ) : null}
                                                                    {row.actions
                                                                        .delete_url ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                deleteStudent(
                                                                                    row,
                                                                                )
                                                                            }
                                                                            aria-label={`Eliminar cuenta de ${row.actions.student_name}`}
                                                                            title="Eliminar cuenta"
                                                                            className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-700 transition-colors hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    ) : null}
                                                                    {reviewCount >
                                                                    0 ? (
                                                                        <Link
                                                                            href={
                                                                                row
                                                                                    .actions
                                                                                    .view_url
                                                                            }
                                                                            title={`Solicitudes pendientes: ${reviewLabels.join(', ')}`}
                                                                            className="inline-flex max-w-44 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[0.6rem] font-bold text-amber-800 transition-colors hover:bg-amber-200"
                                                                        >
                                                                            <span className="truncate">
                                                                                Revisión{' '}
                                                                                {
                                                                                    reviewLabels[0]
                                                                                }
                                                                            </span>
                                                                            {reviewCount >
                                                                            1 ? (
                                                                                <span className="shrink-0">
                                                                                    +
                                                                                    {reviewCount -
                                                                                        1}
                                                                                </span>
                                                                            ) : null}
                                                                        </Link>
                                                                    ) : null}
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                    );
                                                }

                                                const value =
                                                    row.cells[column.key] ??
                                                    '—';
                                                const tone =
                                                    row.tones?.[column.key];

                                                return (
                                                    <td
                                                        key={column.key}
                                                        className="max-w-[320px] px-5 py-3.5 align-middle text-xs font-medium text-foreground"
                                                    >
                                                        {row.url &&
                                                        column.key ===
                                                            'student' ? (
                                                            <Link
                                                                href={row.url}
                                                                className="font-bold text-upel-blue hover:underline"
                                                            >
                                                                {value}
                                                            </Link>
                                                        ) : tone ? (
                                                            <ToneBadge
                                                                tone={
                                                                    tone as Tone
                                                                }
                                                            >
                                                                {value}
                                                            </ToneBadge>
                                                        ) : (
                                                            <span className="leading-relaxed">
                                                                {value}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
