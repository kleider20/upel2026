import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import {
    index as classroomsIndex,
    store as classroomsStore,
    update as classroomsUpdate,
} from '@/routes/admin/classrooms';

type ClassroomRecord = {
    id: number;
    code: string;
    name: string;
    capacity: number | null;
    is_active: boolean;
};

type FormData = {
    code: string;
    name: string;
    capacity: string;
    is_active: boolean;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';
const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/** Alta y edición de aulas del catálogo de horarios. */
export default function AdminClassroomForm({
    classroom,
}: {
    classroom: ClassroomRecord | null;
}) {
    const form = useForm<FormData>({
        code: classroom?.code ?? '',
        name: classroom?.name ?? '',
        capacity:
            classroom?.capacity !== null && classroom?.capacity !== undefined
                ? String(classroom.capacity)
                : '',
        is_active: classroom?.is_active ?? true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (classroom !== null) {
            form.put(classroomsUpdate.url(classroom.id), {
                preserveScroll: true,
            });

            return;
        }

        form.post(classroomsStore.url());
    };

    return (
        <>
            <Head
                title={classroom === null ? 'Registrar aula' : 'Editar aula'}
            />

            <PageHeader
                eyebrow="Gestión de horarios"
                title={classroom === null ? 'Registrar aula' : 'Editar aula'}
                description="El código identifica el aula en las planillas y en la exportación a calendario."
                actions={
                    <Link
                        href={classroomsIndex.url()}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        Volver al listado
                    </Link>
                }
            />

            <form
                onSubmit={submit}
                className="mt-6 max-w-2xl space-y-6 rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="code" className={labelClass}>
                            Código
                        </label>
                        <input
                            id="code"
                            type="text"
                            value={form.data.code}
                            onChange={(event) =>
                                form.setData('code', event.target.value)
                            }
                            placeholder="A-101"
                            className={inputClass}
                        />
                        <InputError
                            message={form.errors.code}
                            className="mt-1 text-xs"
                        />
                    </div>
                    <div>
                        <label htmlFor="capacity" className={labelClass}>
                            Capacidad (opcional)
                        </label>
                        <input
                            id="capacity"
                            type="number"
                            min={1}
                            value={form.data.capacity}
                            onChange={(event) =>
                                form.setData('capacity', event.target.value)
                            }
                            placeholder="35"
                            className={inputClass}
                        />
                        <InputError
                            message={form.errors.capacity}
                            className="mt-1 text-xs"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="name" className={labelClass}>
                            Nombre
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Sala de clases 1"
                            className={inputClass}
                        />
                        <InputError
                            message={form.errors.name}
                            className="mt-1 text-xs"
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <input
                        type="checkbox"
                        checked={form.data.is_active}
                        onChange={(event) =>
                            form.setData('is_active', event.target.checked)
                        }
                        className="size-4 rounded border-border"
                    />
                    Aula activa
                </label>

                <div className="flex items-center gap-2 border-t border-border pt-5">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 disabled:opacity-60"
                    >
                        {form.processing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        Guardar
                    </button>
                </div>
            </form>
        </>
    );
}
