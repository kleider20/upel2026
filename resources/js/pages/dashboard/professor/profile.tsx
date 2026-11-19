import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    ImageUp,
    Loader2,
    Mail,
    Save,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';
import { useInitials } from '@/hooks/use-initials';
import profile from '@/routes/professor/profile';

type ProfileRecord = {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    identity_document: string | null;
    department: string | null;
    academic_title: string | null;
    position: string | null;
    bio: string | null;
    photo_url: string | null;
};

type ProfileFormData = {
    position: string;
    department: string;
    academic_title: string;
    bio: string;
    photo: File | null;
    remove_photo: boolean;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';

const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

/**
 * Perfil público del docente: fotografía tipo carnet, cargo y reseña que se
 * publican en la sección "Profesionales que inspiran" de la landing.
 */
export default function ProfessorProfilePage({
    profile: record,
}: {
    profile: ProfileRecord;
}) {
    const getInitials = useInitials();
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const form = useForm<ProfileFormData>({
        position: record.position ?? '',
        department: record.department ?? '',
        academic_title: record.academic_title ?? '',
        bio: record.bio ?? '',
        photo: null,
        remove_photo: false,
    });

    useEffect(() => {
        const photo = form.data.photo;

        if (photo === null) {
            setPhotoPreview(null);

            return;
        }

        const url = URL.createObjectURL(photo);
        setPhotoPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [form.data.photo]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.put(profile.update.url(), {
            preserveScroll: true,
        });
    };

    const avatarUrl =
        photoPreview ??
        (!form.data.remove_photo ? (record.photo_url ?? null) : null);

    const previewRole =
        form.data.position.trim() ||
        form.data.academic_title.trim() ||
        'Docente UPEL';

    const previewBio =
        form.data.bio.trim() ||
        (form.data.department.trim()
            ? `Docente del departamento de ${form.data.department.trim()} de la UPEL.`
            : 'Docente de la Universidad Pedagógica Experimental Libertador.');

    return (
        <>
            <Head title="Mi perfil" />

            <div className="space-y-6">
                <PageHeader
                    eyebrow="Cuenta y perfil docente"
                    title="Mi perfil"
                    description="Tu cuenta tiene el rol Profesor y accede al portal académico. La fotografía tipo carnet, el cargo y la reseña se publican en la sección “Profesionales que inspiran” de la landing."
                />

                <form
                    onSubmit={submit}
                    className="grid gap-6 xl:grid-cols-[1fr_340px]"
                >
                    <section className="space-y-6">
                        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <div className="flex items-center gap-2">
                                <ImageUp className="size-4 text-upel-blue" />
                                <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                    Fotografía de perfil
                                </h2>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                Sube una foto tipo carnet (JPG, PNG o WEBP,
                                máximo 2 MB). Se usará como tu avatar en la
                                landing y en la cabecera del portal.
                            </p>

                            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`Fotografía de ${record.name}`}
                                        className="h-24 w-24 rounded-full object-cover ring-4 ring-upel-cloud"
                                    />
                                ) : (
                                    <span
                                        className="flex h-24 w-24 items-center justify-center rounded-full bg-upel-navy text-2xl font-extrabold text-upel-gold ring-4 ring-upel-cloud"
                                        aria-hidden="true"
                                    >
                                        {getInitials(record.name)}
                                    </span>
                                )}

                                <div className="flex-1">
                                    <label
                                        htmlFor="photo"
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm transition-colors hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                                    >
                                        <ImageUp className="size-3.5" />
                                        {avatarUrl
                                            ? 'Cambiar fotografía'
                                            : 'Subir fotografía'}
                                    </label>
                                    <input
                                        id="photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        onChange={(event) => {
                                            form.setData(
                                                'photo',
                                                event.target.files?.[0] ?? null,
                                            );
                                            form.setData('remove_photo', false);
                                        }}
                                    />
                                    <p className="mt-2 text-[0.68rem] text-muted-foreground">
                                        {form.data.photo
                                            ? form.data.photo.name
                                            : 'La foto se recorta en círculo dentro de la tarjeta.'}
                                    </p>
                                    <InputError
                                        message={form.errors.photo}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            {record.photo_url && !form.data.remove_photo ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (form.data.photo) {
                                            form.setData('photo', null);
                                            form.setData('remove_photo', false);

                                            return;
                                        }

                                        form.setData('remove_photo', true);
                                    }}
                                    className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-red-700 transition-colors hover:text-red-800 dark:text-red-400"
                                >
                                    <Trash2 className="size-3.5" />
                                    Quitar fotografía
                                </button>
                            ) : form.data.remove_photo ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData('remove_photo', false)
                                    }
                                    className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-upel-blue transition-colors hover:text-upel-navy dark:text-foreground"
                                >
                                    Deshacer cambio
                                </button>
                            ) : null}
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm dark:bg-card">
                            <h2 className="text-sm font-bold text-upel-navy dark:text-foreground">
                                Información publicada
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                Estos datos aparecen en tu tarjeta del claustro
                                docente.
                            </p>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="position"
                                        className={labelClass}
                                    >
                                        Cargo
                                    </label>
                                    <input
                                        id="position"
                                        type="text"
                                        value={form.data.position}
                                        onChange={(event) =>
                                            form.setData(
                                                'position',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Decana de Postgrado"
                                        className={inputClass}
                                    />
                                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                                        Distinción que aparece debajo de tu
                                        nombre, por ejemplo “Decana de
                                        Postgrado”.
                                    </p>
                                    <InputError
                                        message={form.errors.position}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="academic_title"
                                        className={labelClass}
                                    >
                                        Título académico
                                    </label>
                                    <input
                                        id="academic_title"
                                        type="text"
                                        value={form.data.academic_title}
                                        onChange={(event) =>
                                            form.setData(
                                                'academic_title',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Doctora en Educación"
                                        className={inputClass}
                                    />
                                    <InputError
                                        message={form.errors.academic_title}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="department"
                                        className={labelClass}
                                    >
                                        Departamento
                                    </label>
                                    <input
                                        id="department"
                                        type="text"
                                        value={form.data.department}
                                        onChange={(event) =>
                                            form.setData(
                                                'department',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Educación"
                                        className={inputClass}
                                    />
                                    <InputError
                                        message={form.errors.department}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="bio" className={labelClass}>
                                        Reseña profesional
                                    </label>
                                    <textarea
                                        id="bio"
                                        value={form.data.bio}
                                        onChange={(event) =>
                                            form.setData(
                                                'bio',
                                                event.target.value.slice(
                                                    0,
                                                    800,
                                                ),
                                            )
                                        }
                                        rows={4}
                                        placeholder="Doctora en Educación con 22 años de experiencia en formación avanzada y gestión académica."
                                        className="w-full rounded-xl border border-border bg-upel-cloud/50 px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card"
                                    />
                                    <div className="mt-1 flex items-center justify-between gap-3">
                                        <p className="text-[0.65rem] text-muted-foreground">
                                            Se muestra en tu tarjeta de la
                                            landing.
                                        </p>
                                        <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                            {form.data.bio.length}/800
                                        </span>
                                    </div>
                                    <InputError
                                        message={form.errors.bio}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-2 border-t border-border pt-5">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-upel-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Save className="size-3.5" />
                                    )}
                                    Guardar cambios
                                </button>
                                <p className="text-[0.65rem] text-muted-foreground">
                                    Los datos de la cuenta no se modifican desde
                                    aquí.
                                </p>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Vista previa en la landing
                            </p>

                            <article className="mt-4 flex flex-col items-center rounded-[20px] border border-upel-mist bg-white p-5 text-center shadow-[0_8px_24px_-20px_rgba(10,37,64,0.3)]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`Fotografía de ${record.name}`}
                                        className="size-20 rounded-full object-cover ring-4 ring-upel-cloud"
                                    />
                                ) : (
                                    <span
                                        className="flex size-20 items-center justify-center rounded-full bg-upel-navy text-xl font-extrabold text-upel-gold ring-4 ring-upel-cloud"
                                        aria-hidden="true"
                                    >
                                        {getInitials(record.name)}
                                    </span>
                                )}
                                <h3 className="mt-3 text-[0.9rem] leading-tight font-extrabold text-upel-navy">
                                    {record.name}
                                </h3>
                                <p className="mt-1 text-[0.62rem] font-extrabold tracking-wide text-upel-gold uppercase">
                                    {previewRole}
                                </p>
                                <p className="mt-2 text-[0.7rem] leading-relaxed text-upel-slate">
                                    {previewBio}
                                </p>
                            </article>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
                            <div className="flex items-center gap-2">
                                <UserRound className="size-4 text-upel-blue" />
                                <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                    Datos de la cuenta
                                </p>
                            </div>

                            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Nombre completo
                                    </dt>
                                    <dd className="max-w-[170px] text-right font-bold text-upel-navy dark:text-foreground">
                                        {record.name}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Correo
                                    </dt>
                                    <dd className="max-w-[170px] truncate text-right font-bold text-upel-navy dark:text-foreground">
                                        {record.email}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Código
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {record.employee_code}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Cédula
                                    </dt>
                                    <dd className="font-bold text-upel-navy dark:text-foreground">
                                        {record.identity_document ?? '—'}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-4 flex items-start gap-2 rounded-xl bg-upel-cloud/70 px-3 py-2.5 text-[0.65rem] leading-relaxed text-muted-foreground dark:bg-muted/30">
                                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-upel-green" />
                                La cédula se muestra en la cabecera de las
                                planillas de evaluación. Si necesitas corregir
                                tu nombre, correo, código o cédula, contacta a
                                la coordinación académica.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-white p-5 text-xs shadow-sm dark:bg-card">
                            <div className="flex items-center gap-2 text-upel-blue">
                                <Mail className="size-4" />
                                <p className="font-bold">Contacto público</p>
                            </div>
                            <p className="mt-2 leading-relaxed text-muted-foreground">
                                La landing muestra un botón para escribirte a{' '}
                                <span className="font-semibold text-upel-navy dark:text-foreground">
                                    {record.email}
                                </span>
                                .
                            </p>
                        </div>
                    </aside>
                </form>
            </div>
        </>
    );
}
