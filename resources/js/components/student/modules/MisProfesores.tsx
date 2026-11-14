import { Link } from '@inertiajs/react';
import { Mail, UserRound, Users } from 'lucide-react';
import type { StudentDashboardProps, StudentTeacher } from '@/types/student';

function initialsOf(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

/** Abreviatura del título académico, como en las tarjetas de la portada. */
function academicPrefix(title: string): string | null {
    const normalized = title.trim().toLowerCase();

    if (normalized.startsWith('doctora')) {
        return 'Dra.';
    }

    if (normalized.startsWith('doctor')) {
        return 'Dr.';
    }

    if (
        normalized.startsWith('magíster') ||
        normalized.startsWith('magister')
    ) {
        return 'Mgtr.';
    }

    if (normalized.startsWith('especialista')) {
        return 'Esp.';
    }

    if (normalized.startsWith('licenciada')) {
        return 'Lcda.';
    }

    if (normalized.startsWith('licenciado')) {
        return 'Lcdo.';
    }

    return null;
}

function displayName(professor: StudentTeacher): string {
    const prefix = academicPrefix(professor.academic_title);

    return prefix !== null ? `${prefix} ${professor.name}` : professor.name;
}

function describe(professor: StudentTeacher): string {
    const title = professor.academic_title?.trim().replace(/\.$/, '');
    const subjects =
        professor.subjects.length > 0
            ? `Imparte ${professor.subjects.join(', ')}`
            : null;
    const parts = [title, subjects].filter(Boolean);

    return parts.length > 0 ? `${parts.join('. ')}.` : 'Docente de la UPEL.';
}

function semesterLabel(semesters: number[]): string | null {
    if (semesters.length === 0) {
        return null;
    }

    return semesters.length === 1
        ? `Semestre ${semesters[0]}°`
        : `Semestres ${semesters.join(' · ')}`;
}

/** Cantidad de docentes distintos, aunque dicten en varios períodos. */
function uniqueTeacherCount(teachers: StudentTeacher[]): number {
    return new Set(teachers.map((professor) => professor.id)).size;
}

export function MisProfesores({ teachers }: StudentDashboardProps) {
    // Se respeta el orden de aparición del horario al agrupar por período.
    const groups = teachers.reduce<
        { period: string; teachers: StudentTeacher[] }[]
    >((carry, professor) => {
        const period = professor.period ?? 'Período actual';
        const group = carry.find((item) => item.period === period);

        if (group) {
            group.teachers.push(professor);
        } else {
            carry.push({ period, teachers: [professor] });
        }

        return carry;
    }, []);

    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                    Cuerpo docente asignado
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                    Mis Profesores ({uniqueTeacherCount(teachers)})
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Docentes que imparten las materias de tu horario, agrupados
                    por período académico.
                </p>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-12 text-center dark:bg-card">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                        No hay profesores asignados
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Cuando tu horario tenga docentes asignados aparecerán
                        aquí, agrupados por período.
                    </p>
                </div>
            ) : (
                groups.map((group) => (
                    <section key={group.period} className="space-y-4">
                        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2">
                            <div>
                                <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-upel-blue uppercase">
                                    Período académico
                                </p>
                                <h3 className="mt-0.5 font-display text-lg font-bold text-upel-navy dark:text-foreground">
                                    {group.period}
                                </h3>
                            </div>
                            <span className="rounded-full bg-upel-cloud px-3 py-1 text-[0.65rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground">
                                {group.teachers.length}{' '}
                                {group.teachers.length === 1
                                    ? 'docente'
                                    : 'docentes'}
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {group.teachers.map((professor) => {
                                const semesters = semesterLabel(
                                    professor.semesters,
                                );

                                return (
                                    <article
                                        key={professor.id}
                                        className="group flex h-full flex-col items-center rounded-[20px] border border-upel-mist bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-upel-gold/40 hover:shadow-md dark:border-border dark:bg-card"
                                    >
                                        <div className="flex size-24 items-center justify-center rounded-full bg-upel-navy text-2xl font-extrabold text-upel-gold ring-4 ring-upel-cloud transition-transform duration-300 group-hover:scale-105 dark:ring-muted">
                                            {initialsOf(professor.name)}
                                        </div>

                                        <h4 className="mt-4 font-display text-[0.95rem] leading-tight font-extrabold text-upel-navy dark:text-foreground">
                                            {displayName(professor)}
                                        </h4>
                                        <p className="mt-1 text-[0.65rem] font-extrabold tracking-wide text-upel-gold uppercase">
                                            {professor.department}
                                        </p>
                                        {semesters !== null ? (
                                            <p className="mt-1 text-[0.65rem] font-bold text-muted-foreground">
                                                {semesters}
                                            </p>
                                        ) : null}
                                        <p className="mt-2 flex-1 text-[0.72rem] leading-relaxed text-upel-slate dark:text-muted-foreground">
                                            {describe(professor)}
                                        </p>

                                        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                                            {professor.subjects.map(
                                                (subject) => (
                                                    <span
                                                        key={subject}
                                                        className="rounded-full bg-upel-cloud px-2.5 py-0.5 text-[0.6rem] font-bold text-upel-navy ring-1 ring-border dark:bg-muted dark:text-muted-foreground"
                                                    >
                                                        {subject}
                                                    </span>
                                                ),
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 border-t border-upel-mist pt-3 dark:border-border">
                                            <a
                                                href={`mailto:${professor.email}`}
                                                aria-label={`Enviar correo a ${professor.name}`}
                                                className="inline-flex size-8 items-center justify-center rounded-full bg-upel-cloud text-upel-slate transition-colors hover:bg-upel-navy hover:text-white dark:bg-muted dark:text-muted-foreground"
                                            >
                                                <Mail
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                            {professor.profile_url ? (
                                                <Link
                                                    href={professor.profile_url}
                                                    aria-label={`Ver perfil de ${professor.name}`}
                                                    className="inline-flex size-8 items-center justify-center rounded-full bg-upel-cloud text-upel-slate transition-colors hover:bg-upel-navy hover:text-white dark:bg-muted dark:text-muted-foreground"
                                                >
                                                    <UserRound
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}
