import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Building2,
    GraduationCap,
    Mail,
} from 'lucide-react';
import StudentLayout from '@/layouts/student-layout';
import { type StudentTab } from '@/components/student/Sidebar';
import type { StudentProfessorPageProps } from '@/types/student';

export default function StudentProfessorShow({
    professor,
    subjects_url,
    dashboard_url,
}: StudentProfessorPageProps) {
    const initials = professor.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const navigate = (tab: StudentTab) => {
        router.visit(`${dashboard_url}?tab=${tab}`);
    };

    return (
        <>
            <Head title={`${professor.name} · UPEL`} />

            <StudentLayout activeTab="profesores" onSelectTab={navigate}>
                <div className="space-y-6">
                    <Link
                        href={subjects_url}
                        className="inline-flex items-center gap-2 text-xs font-bold text-upel-blue hover:text-upel-navy hover:underline dark:hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a mis materias
                    </Link>

                    <section className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm dark:bg-card">
                        <div className="bg-upel-navy px-6 py-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-upel-gold text-xl font-extrabold text-upel-navy shadow-sm">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-gold uppercase">
                                        Perfil del docente
                                    </p>
                                    <h1 className="mt-1 font-display text-2xl font-bold text-white">
                                        {professor.name}
                                    </h1>
                                    <p className="mt-1 text-xs font-semibold text-white/80">
                                        {professor.academic_title}
                                    </p>
                                    {professor.assigned_in_schedule ? (
                                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-bold text-white ring-1 ring-white/20">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            Docente asignado en tu horario
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 p-6 sm:grid-cols-3">
                            <div>
                                <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
                                    Departamento
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-upel-navy dark:text-foreground">
                                    <Building2 className="h-4 w-4 text-upel-blue" />
                                    {professor.department}
                                </p>
                            </div>

                            <div>
                                <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
                                    Código de empleado
                                </p>
                                <p className="mt-1 text-xs font-bold text-upel-navy dark:text-foreground">
                                    {professor.employee_code ?? 'No registrado'}
                                </p>
                            </div>

                            <div>
                                <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
                                    Correo institucional
                                </p>
                                <a
                                    href={`mailto:${professor.email}`}
                                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-upel-blue hover:underline"
                                >
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">
                                        {professor.email}
                                    </span>
                                </a>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
                        <p className="text-[0.66rem] font-extrabold tracking-[0.16em] text-upel-blue uppercase">
                            Carga académica
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold text-upel-navy dark:text-foreground">
                            Materias que te dicta ({professor.subjects.length})
                        </h2>

                        {professor.subjects.length === 0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-border bg-upel-cloud/40 p-10 text-center dark:bg-muted/30">
                                <BookOpen className="mx-auto h-9 w-9 text-muted-foreground/60" />
                                <p className="mt-3 text-sm font-bold text-upel-navy dark:text-foreground">
                                    Sin materias asignadas
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Este docente todavía no tiene materias
                                    asignadas en tu horario.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {professor.subjects.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="rounded-xl border border-border/80 bg-upel-cloud/40 p-4 dark:bg-muted/30"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="rounded-lg bg-white px-2.5 py-1 text-[0.65rem] font-extrabold text-upel-navy ring-1 ring-border dark:bg-card dark:text-foreground">
                                                {subject.code}
                                            </span>
                                            <span className="text-[0.65rem] font-bold text-muted-foreground">
                                                Semestre {subject.semester}° ·{' '}
                                                {subject.credits} U.C.
                                            </span>
                                        </div>
                                        <p className="mt-2.5 text-sm font-bold text-upel-navy dark:text-foreground">
                                            {subject.name}
                                        </p>
                                        <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">
                                            {subject.career ?? 'UPEL'} ·{' '}
                                            {subject.modality ?? 'Presencial'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </StudentLayout>
        </>
    );
}
