import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    FileText,
    FolderLock,
    Pencil,
    Trash2,
    UserRound,
} from 'lucide-react';
import { EmptyState } from '@/components/portal/empty-state';
import { PageHeader } from '@/components/portal/page-header';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import { module as adminModule } from '@/routes/admin';

type Student = {
    name: string;
    email: string;
    student_code: string;
    career: string | null;
    semester: number;
    status: string;
    phone: string | null;
    address: string | null;
    edit_url: string;
    delete_url: string;
};

type StudentDocument = {
    id: number;
    type_label: string;
    status_label: string;
    status_tone: string;
    original_name: string;
    size: string;
    is_previewable: boolean;
    download_url: string;
    preview_url: string;
};

type Props = {
    student: Student;
    can_view_documents: boolean;
    document_folder: string | null;
    documents: StudentDocument[];
};

export default function StudentProfilePage({
    student,
    can_view_documents,
    document_folder,
    documents,
}: Props) {
    const deleteStudent = () => {
        if (
            !window.confirm(
                `¿Eliminar permanentemente la cuenta de ${student.name}? También se eliminarán su perfil, inscripciones y pagos. La solicitud de admisión permanecerá como registro histórico.`,
            )
        ) {
            return;
        }

        router.delete(student.delete_url);
    };

    return (
        <>
            <Head title={`Perfil de ${student.name}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Expediente estudiantil"
                    title={student.name}
                    description={`Código ${student.student_code} · ${student.career ?? 'Carrera no asignada'}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={student.edit_url}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <Pencil className="size-3.5" />
                                Editar
                            </Link>
                            <button
                                type="button"
                                onClick={deleteStudent}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                            >
                                <Trash2 className="size-3.5" />
                                Eliminar
                            </button>
                            <Link
                                href={adminModule({ module: 'students' })}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                            >
                                <ArrowLeft
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Volver a estudiantes
                            </Link>
                        </div>
                    }
                />

                <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-upel-navy dark:text-foreground">
                        <UserRound
                            className="size-4 text-upel-blue"
                            aria-hidden="true"
                        />
                        Perfil académico
                    </h2>
                    <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Correo
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.email}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Carrera
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.career ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Semestre
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.semester}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Estado
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.status}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Teléfono
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.phone ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-muted-foreground">
                                Dirección
                            </dt>
                            <dd className="mt-1 font-semibold text-foreground">
                                {student.address ?? '—'}
                            </dd>
                        </div>
                    </dl>
                </section>

                {can_view_documents ? (
                    <section className="rounded-2xl border border-border/70 bg-white shadow-sm dark:bg-card">
                        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                            <FolderLock
                                className="size-4 text-upel-blue"
                                aria-hidden="true"
                            />
                            <div>
                                <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    Carpeta documental privada
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {document_folder
                                        ? `Expediente asociado a la cédula ${document_folder}. Solo personal con permiso de admisiones puede abrir los archivos.`
                                        : 'Este perfil no tiene una solicitud de preinscripción vinculada.'}
                                </p>
                            </div>
                        </div>

                        {document_folder && documents.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {documents.map((document) => (
                                    <li
                                        key={document.id}
                                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <FileText
                                                className="mt-0.5 size-4 shrink-0 text-upel-blue"
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground">
                                                    {document.type_label}
                                                </p>
                                                <p className="mt-1 truncate text-[0.68rem] text-muted-foreground">
                                                    {document.original_name} ·{' '}
                                                    {document.size}
                                                </p>
                                            </div>
                                            <ToneBadge
                                                tone={
                                                    document.status_tone as Tone
                                                }
                                            >
                                                {document.status_label}
                                            </ToneBadge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                                            <a
                                                href={document.download_url}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-navy transition-colors hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                                            >
                                                <Download
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                                Descargar
                                            </a>
                                            {document.is_previewable ? (
                                                <a
                                                    href={document.preview_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-[0.65rem] font-bold text-upel-blue transition-colors hover:bg-upel-cloud dark:hover:bg-muted"
                                                >
                                                    Ver archivo
                                                </a>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : document_folder ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={FileText}
                                    title="Carpeta sin documentos"
                                    description="Todavía no se han cargado documentos para este expediente."
                                />
                            </div>
                        ) : null}
                    </section>
                ) : (
                    <section className="rounded-2xl border border-border/70 bg-white p-5 text-xs text-muted-foreground shadow-sm dark:bg-card">
                        No tienes el permiso <strong>admissions.view</strong>{' '}
                        para consultar documentos privados.
                    </section>
                )}
            </div>
        </>
    );
}
