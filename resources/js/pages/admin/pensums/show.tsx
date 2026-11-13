import { useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Download,
    Eye,
    GraduationCap,
    Layers,
    Pencil,
    Plus,
    Printer,
    Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    index as pensumsIndex,
    pdf as pensumPdf,
} from '@/routes/admin/pensums';
import { create as subjectsCreate } from '@/routes/admin/subjects';

type Career = {
    id: number;
    name: string;
    code: string;
    icon: string;
    degree: string;
    duration_semesters: number;
    subjects_count: number;
    credits_total: number;
};

type SubjectRow = {
    id: number;
    code: string;
    name: string;
    credits: number;
    theory_hours: number;
    practice_hours: number;
    component: string | null;
    type: string | null;
    area: string | null;
    level: string | null;
    modality: string;
    modality_label: string;
    prerequisites: string | null;
    is_active: boolean;
    edit_url: string;
    delete_url: string;
};

type PensumPeriod = {
    semester: number;
    label: string;
    credits: number;
    subjects: SubjectRow[];
};

type Props = {
    career: Career;
    pensum: PensumPeriod[];
    can_manage: boolean;
};

/**
 * Pensum de una carrera agrupado por período académico.
 */
export default function AdminPensumShow({ career, pensum, can_manage }: Props) {
    useEffect(() => {
        document.body.classList.add('pensum-print-page');

        return () => document.body.classList.remove('pensum-print-page');
    }, []);

    const deleteSubject = (subject: SubjectRow) => {
        if (
            !window.confirm(
                `¿Eliminar la materia ${subject.name} del pensum? Si tiene inscripciones registradas no se podrá borrar.`,
            )
        ) {
            return;
        }

        router.delete(subject.delete_url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Pensum de ${career.name}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Pensum de la carrera"
                    title={career.name}
                    description={`${career.code} · ${career.degree} · ${career.duration_semesters} períodos académicos.`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can_manage ? (
                                <Link
                                    href={subjectsCreate.url({
                                        query: { career_id: career.id },
                                    })}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="size-3.5" />
                                    Agregar materia
                                </Link>
                            ) : null}
                            <a
                                href={pensumPdf.url({
                                    career: career.code,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <Eye className="size-3.5" />
                                Ver PDF
                            </a>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <Printer className="size-3.5" />
                                Imprimir
                            </button>
                            <a
                                href={pensumPdf.url(
                                    { career: career.code },
                                    { query: { download: 1 } },
                                )}
                                className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy-800"
                            >
                                <Download className="size-3.5" />
                                Descargar PDF
                            </a>
                            <Link
                                href={pensumsIndex()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <Layers className="size-3.5" />
                                Todos los pensums
                            </Link>
                            <Link
                                href={adminDashboard()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                                Volver al panel
                            </Link>
                        </div>
                    }
                />

                <section
                    aria-label="Resumen del pensum"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <BookOpen
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Materias
                        </p>
                        <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                            {career.subjects_count}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <Layers
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Períodos
                        </p>
                        <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                            {pensum.length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <GraduationCap
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Créditos
                        </p>
                        <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                            {career.credits_total}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <GraduationCap
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Título
                        </p>
                        <p className="mt-2 text-xs font-bold text-foreground">
                            {career.degree}
                        </p>
                    </div>
                </section>

                <article
                    id="pensum-preview"
                    className="pensum-print-document overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-sm sm:p-8 dark:bg-card"
                >
                    <header className="flex items-center justify-center gap-4 border-b border-black pb-4 text-center text-black">
                        <img
                            src="/images/upel-logo.png"
                            alt="Logotipo de la UPEL"
                            className="size-12 shrink-0 object-contain"
                        />
                        <div>
                            <p className="text-[0.68rem] font-bold uppercase">
                                Universidad Pedagógica Experimental Libertador
                            </p>
                            <p className="text-[0.62rem] font-semibold uppercase">
                                Vicerrectorado de Docencia
                            </p>
                            <p className="text-[0.62rem] font-semibold uppercase">
                                Unidad de Currículo
                            </p>
                        </div>
                    </header>

                    <div className="py-4 text-center text-black">
                        <h2 className="text-base font-bold uppercase">
                            Plan curricular de {career.name}
                        </h2>
                        <p className="mt-1 text-[0.65rem]">
                            {career.degree} · {career.code}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="pensum-print-table w-full min-w-[980px] border-collapse text-[0.62rem] leading-tight text-black">
                            <caption className="sr-only">
                                Vista previa del plan curricular de{' '}
                                {career.name}
                            </caption>
                            <thead>
                                <tr className="bg-upel-cloud text-center font-bold uppercase dark:bg-white">
                                    <th className="border border-black px-1 py-2">
                                        PA
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        CA/PA
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Nombres
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Comp.
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Tipo
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Área
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Nivel
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        CA
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        HAD
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        HLE
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Prel.
                                    </th>
                                    <th className="border border-black px-1 py-2">
                                        Modalidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pensum.map((period) =>
                                    period.subjects.map((subject, index) => (
                                        <tr key={subject.id}>
                                            {index === 0 ? (
                                                <>
                                                    <td
                                                        rowSpan={
                                                            period.subjects
                                                                .length
                                                        }
                                                        className="border border-black px-1 py-1 text-center align-middle font-semibold"
                                                    >
                                                        {period.label}
                                                    </td>
                                                    <td
                                                        rowSpan={
                                                            period.subjects
                                                                .length
                                                        }
                                                        className="border border-black px-1 py-1 text-center align-middle font-semibold"
                                                    >
                                                        {period.credits}
                                                    </td>
                                                </>
                                            ) : null}
                                            <td className="border border-black px-1 py-1">
                                                {subject.name}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.component ?? '—'}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.type ?? '—'}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.area ?? '—'}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.level ?? '—'}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.credits}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.theory_hours}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.practice_hours}
                                            </td>
                                            <td className="border border-black px-1 py-1">
                                                {subject.prerequisites ?? '—'}
                                            </td>
                                            <td className="border border-black px-1 py-1 text-center">
                                                {subject.modality_label}
                                            </td>
                                        </tr>
                                    )),
                                )}
                                {pensum.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="border border-black px-3 py-6 text-center"
                                        >
                                            Este pensum aún no tiene materias.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold">
                                    <td
                                        colSpan={7}
                                        className="border border-black px-2 py-1.5 text-right"
                                    >
                                        Total de créditos
                                    </td>
                                    <td className="border border-black px-1 py-1.5 text-center">
                                        {career.credits_total}
                                    </td>
                                    <td
                                        colSpan={4}
                                        className="border border-black"
                                    />
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <p className="mt-3 text-[0.62rem] text-black">
                        Nota: Las unidades curriculares y sus datos corresponden
                        al pensum registrado para esta carrera.
                    </p>
                </article>

                {pensum.length === 0 ? (
                    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <EmptyState
                            icon={BookOpen}
                            title="Pensum sin materias"
                            description="Agrega la primera materia para comenzar a construir el plan de estudios de esta carrera."
                        />
                        {can_manage ? (
                            <div className="mt-4 text-center">
                                <Link
                                    href={subjectsCreate.url({
                                        query: { career_id: career.id },
                                    })}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800"
                                >
                                    <Plus className="size-3.5" />
                                    Agregar materia
                                </Link>
                            </div>
                        ) : null}
                    </section>
                ) : (
                    <div className="space-y-5">
                        {pensum.map((period) => (
                            <section
                                key={period.semester}
                                className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card"
                            >
                                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-upel-cloud/60 px-5 py-3.5 dark:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-upel-navy text-xs font-bold text-white">
                                            {period.label}
                                        </span>
                                        <div>
                                            <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                                Período {period.label}
                                            </h2>
                                            <p className="text-[0.65rem] text-muted-foreground">
                                                {period.subjects.length}{' '}
                                                materias · {period.credits}{' '}
                                                créditos
                                            </p>
                                        </div>
                                    </div>

                                    {can_manage ? (
                                        <Link
                                            href={subjectsCreate.url({
                                                query: {
                                                    career_id: career.id,
                                                    semester: period.semester,
                                                },
                                            })}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[0.66rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground dark:hover:bg-muted"
                                        >
                                            <Plus
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            Agregar al período
                                        </Link>
                                    ) : null}
                                </header>

                                <ul className="divide-y divide-border">
                                    {period.subjects.map((subject) => (
                                        <li
                                            key={subject.id}
                                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-foreground">
                                                    {subject.name}
                                                    {!subject.is_active ? (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.58rem] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                            Inactiva
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.65rem] text-muted-foreground">
                                                    <span>{subject.code}</span>
                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>
                                                    <span>
                                                        {subject.credits}{' '}
                                                        créditos
                                                    </span>
                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>
                                                    <span>
                                                        {subject.theory_hours} h
                                                        teoría ·{' '}
                                                        {subject.practice_hours}{' '}
                                                        h práctica
                                                    </span>
                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>
                                                    <span>
                                                        {subject.modality_label}
                                                    </span>
                                                </p>
                                                {subject.prerequisites ? (
                                                    <p className="mt-1 text-[0.62rem] font-semibold text-[#8a6c0d]">
                                                        Requiere:{' '}
                                                        {subject.prerequisites}
                                                    </p>
                                                ) : null}
                                            </div>

                                            {can_manage ? (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Link
                                                        href={subject.edit_url}
                                                        aria-label={`Editar ${subject.name}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                                    >
                                                        <Pencil
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteSubject(
                                                                subject,
                                                            )
                                                        }
                                                        aria-label={`Eliminar ${subject.name}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[0.65rem] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
