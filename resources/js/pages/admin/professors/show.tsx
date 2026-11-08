import { useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    Mail,
    Pencil,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { index as professorsIndex } from '@/routes/admin/professors';

type ProfessorSubject = {
    id: number;
    name: string;
    code: string;
    career: string;
    career_code: string;
    semester: number;
    is_active: boolean;
};

type Professor = {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    department: string | null;
    academic_title: string | null;
    must_change_password: boolean;
    email_verified: boolean;
    registered_at: string | null;
    subjects_count: number;
    schedules_count: number;
    subjects: ProfessorSubject[];
    edit_url: string | null;
    delete_url: string | null;
};

type Props = {
    professor: Professor;
};

const ROMAN_PERIODS = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
];

const periodLabel = (semester: number): string =>
    ROMAN_PERIODS[semester - 1] ?? String(semester);

type CareerGroup = {
    key: string;
    career: string;
    career_code: string;
    subjects: ProfessorSubject[];
};

/**
 * Perfil docente con sus datos de cuenta, resumen y materias asignadas.
 */
export default function AdminProfessorShow({ professor }: Props) {
    const careerGroups = useMemo(() => {
        const groups = professor.subjects.reduce<Record<string, CareerGroup>>(
            (acc, subject) => {
                const key = `${subject.career}-${subject.career_code}`;

                if (!acc[key]) {
                    acc[key] = {
                        key,
                        career: subject.career,
                        career_code: subject.career_code,
                        subjects: [],
                    };
                }

                acc[key].subjects.push(subject);

                return acc;
            },
            {},
        );

        return Object.values(groups)
            .map((group) => ({
                ...group,
                subjects: [...group.subjects].sort(
                    (a, b) =>
                        a.semester - b.semester || a.name.localeCompare(b.name),
                ),
            }))
            .sort((a, b) => a.career.localeCompare(b.career));
    }, [professor.subjects]);

    const deleteProfessor = () => {
        if (!professor.delete_url) {
            return;
        }

        if (
            !window.confirm(
                `¿Eliminar permanentemente la cuenta de ${professor.name}? También se eliminará su perfil docente y sus materias asignadas. Los horarios publicados conservarán el registro sin docente asignado.`,
            )
        ) {
            return;
        }

        router.delete(professor.delete_url);
    };

    return (
        <>
            <Head title={`Perfil de ${professor.name}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Perfil docente"
                    title={professor.name}
                    description={`Código ${professor.employee_code} · ${
                        professor.department ?? 'Departamento no asignado'
                    }`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {professor.edit_url ? (
                                <Link
                                    href={professor.edit_url}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                >
                                    <Pencil className="size-3.5" />
                                    Editar
                                </Link>
                            ) : null}
                            {professor.delete_url ? (
                                <button
                                    type="button"
                                    onClick={deleteProfessor}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                                >
                                    <Trash2 className="size-3.5" />
                                    Eliminar
                                </button>
                            ) : null}
                            <Link
                                href={professorsIndex()}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                                Volver a profesores
                            </Link>
                        </div>
                    }
                />

                <section
                    aria-label="Resumen del profesor"
                    className="grid gap-4 sm:grid-cols-3"
                >
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <BookOpen
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Materias asignadas
                        </p>
                        <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                            {professor.subjects_count}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <CalendarDays
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Horarios publicados
                        </p>
                        <p className="mt-2 font-display text-2xl leading-none font-bold text-upel-navy dark:text-foreground">
                            {professor.schedules_count}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                        <p className="flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                            <ShieldCheck
                                className="size-3.5 text-upel-blue"
                                aria-hidden="true"
                            />
                            Estado de la cuenta
                        </p>
                        <p className="mt-2 text-xs font-bold text-foreground">
                            {professor.must_change_password
                                ? 'Contraseña temporal'
                                : 'Cuenta activa'}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            {professor.email_verified
                                ? 'Correo verificado'
                                : 'Correo sin verificar'}
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                        <UserRound
                            className="size-4 text-upel-blue"
                            aria-hidden="true"
                        />
                        Datos del docente
                    </h2>
                    <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Correo institucional
                            </dt>
                            <dd className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                                <Mail
                                    className="size-3.5 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                {professor.email}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Código de empleado
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {professor.employee_code}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Departamento
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {professor.department ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Título académico
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {professor.academic_title ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Registro
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {professor.registered_at ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Contraseña
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {professor.must_change_password
                                    ? 'Temporal, debe cambiarla al ingresar'
                                    : 'Definida por el docente'}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                            Materias que imparte
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Agrupadas por carrera y período académico.
                        </p>
                    </div>

                    {careerGroups.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon={BookOpen}
                                title="Sin materias asignadas"
                                description="Este profesor todavía no tiene materias vinculadas en el catálogo."
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {careerGroups.map((group) => (
                                <div key={group.key} className="px-5 py-4">
                                    <h3 className="text-xs font-extrabold text-upel-navy dark:text-foreground">
                                        {group.career} ({group.career_code})
                                    </h3>
                                    <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {group.subjects.map((subject) => (
                                            <li
                                                key={subject.id}
                                                className="rounded-lg border border-border/70 p-3"
                                            >
                                                <p className="text-xs font-bold text-foreground">
                                                    {subject.name}
                                                </p>
                                                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                                                    <span>{subject.code}</span>
                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>
                                                    <span>
                                                        Período{' '}
                                                        {periodLabel(
                                                            subject.semester,
                                                        )}
                                                    </span>
                                                    {!subject.is_active ? (
                                                        <>
                                                            <span aria-hidden="true">
                                                                ·
                                                            </span>
                                                            <span className="font-bold text-amber-700 dark:text-amber-400">
                                                                Inactiva
                                                            </span>
                                                        </>
                                                    ) : null}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
