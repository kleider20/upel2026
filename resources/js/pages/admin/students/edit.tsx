import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/portal/page-header';

type StudentFormData = {
    name: string;
    email: string;
    student_code: string;
    career_id: number | null;
    current_semester: number;
    status: string;
    phone: string;
    personal_email: string;
    address: string;
    birth_date: string;
    birth_place: string;
    emergency_contact: string;
    shift: string;
    advisor: string;
    admission_year: number | null;
    graduation_year: number | null;
};

type Option = {
    value: string;
    label: string;
};

type Student = StudentFormData;

type Props = {
    student: Student;
    careers: Option[];
    statuses: Option[];
    shifts: Option[];
    update_url: string;
    show_url: string;
};

const labelClass =
    'mb-1.5 block text-[0.66rem] font-bold tracking-wide text-muted-foreground uppercase';
const inputClass =
    'h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-foreground focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-muted/40 dark:focus:bg-card';

function TextField({
    id,
    label,
    value,
    type = 'text',
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string | number;
    type?: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={inputClass}
            />
            <InputError message={error} className="mt-1" />
        </div>
    );
}

function SelectField({
    id,
    label,
    value,
    options,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string | number | null;
    options: Option[];
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <select
                id={id}
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
                className={inputClass}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

export default function AdminStudentEdit({
    student,
    careers,
    statuses,
    shifts,
    update_url,
    show_url,
}: Props) {
    const form = useForm<StudentFormData>(student);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(update_url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Editar estudiante ${student.student_code}`} />

            <div className="space-y-6">
                <PageHeader
                    eyebrow={`Estudiante ${student.student_code}`}
                    title="Editar perfil estudiantil"
                    description="Corrige los datos de acceso y académicos del estudiante."
                    actions={
                        <Link
                            href={show_url}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-upel-navy shadow-sm hover:bg-upel-cloud dark:bg-card dark:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            Volver al perfil
                        </Link>
                    }
                />

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border border-border/70 bg-white p-5 shadow-sm sm:p-6 dark:bg-card"
                >
                    <section className="space-y-4">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Datos de la cuenta
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField
                                id="name"
                                label="Nombre completo"
                                value={form.data.name}
                                error={form.errors.name}
                                onChange={(value) =>
                                    form.setData('name', value)
                                }
                            />
                            <TextField
                                id="email"
                                label="Correo de acceso"
                                type="email"
                                value={form.data.email}
                                error={form.errors.email}
                                onChange={(value) =>
                                    form.setData('email', value)
                                }
                            />
                            <TextField
                                id="student_code"
                                label="Código de estudiante"
                                value={form.data.student_code}
                                error={form.errors.student_code}
                                onChange={(value) =>
                                    form.setData('student_code', value)
                                }
                            />
                            <TextField
                                id="phone"
                                label="Teléfono"
                                type="tel"
                                value={form.data.phone}
                                error={form.errors.phone}
                                onChange={(value) =>
                                    form.setData('phone', value)
                                }
                            />
                            <TextField
                                id="personal_email"
                                label="Correo personal"
                                type="email"
                                value={form.data.personal_email}
                                error={form.errors.personal_email}
                                onChange={(value) =>
                                    form.setData('personal_email', value)
                                }
                            />
                            <TextField
                                id="birth_date"
                                label="Fecha de nacimiento"
                                type="date"
                                value={form.data.birth_date}
                                error={form.errors.birth_date}
                                onChange={(value) =>
                                    form.setData('birth_date', value)
                                }
                            />
                            <TextField
                                id="birth_place"
                                label="Lugar de nacimiento"
                                value={form.data.birth_place}
                                error={form.errors.birth_place}
                                onChange={(value) =>
                                    form.setData('birth_place', value)
                                }
                            />
                            <TextField
                                id="emergency_contact"
                                label="Contacto de emergencia"
                                value={form.data.emergency_contact}
                                error={form.errors.emergency_contact}
                                onChange={(value) =>
                                    form.setData('emergency_contact', value)
                                }
                            />
                            <div className="md:col-span-2">
                                <TextField
                                    id="address"
                                    label="Dirección"
                                    value={form.data.address}
                                    error={form.errors.address}
                                    onChange={(value) =>
                                        form.setData('address', value)
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 border-t border-border pt-5">
                        <h2 className="text-sm font-extrabold text-upel-navy dark:text-foreground">
                            Datos académicos
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField
                                id="career_id"
                                label="Carrera"
                                value={form.data.career_id}
                                options={[
                                    {
                                        value: '',
                                        label: 'Sin carrera asignada',
                                    },
                                    ...careers,
                                ]}
                                error={form.errors.career_id}
                                onChange={(value) =>
                                    form.setData(
                                        'career_id',
                                        value === '' ? null : Number(value),
                                    )
                                }
                            />
                            <SelectField
                                id="status"
                                label="Estado"
                                value={form.data.status}
                                options={statuses}
                                error={form.errors.status}
                                onChange={(value) =>
                                    form.setData('status', value)
                                }
                            />
                            <TextField
                                id="current_semester"
                                label="Semestre actual"
                                type="number"
                                value={form.data.current_semester}
                                error={form.errors.current_semester}
                                onChange={(value) =>
                                    form.setData(
                                        'current_semester',
                                        Number(value),
                                    )
                                }
                            />
                            <SelectField
                                id="shift"
                                label="Turno"
                                value={form.data.shift}
                                options={[
                                    { value: '', label: 'Sin especificar' },
                                    ...shifts,
                                ]}
                                error={form.errors.shift}
                                onChange={(value) =>
                                    form.setData('shift', value)
                                }
                            />
                            <TextField
                                id="admission_year"
                                label="Año de ingreso"
                                type="number"
                                value={form.data.admission_year ?? ''}
                                error={form.errors.admission_year}
                                onChange={(value) =>
                                    form.setData(
                                        'admission_year',
                                        value === '' ? null : Number(value),
                                    )
                                }
                            />
                            <TextField
                                id="graduation_year"
                                label="Año de egreso"
                                type="number"
                                value={form.data.graduation_year ?? ''}
                                error={form.errors.graduation_year}
                                onChange={(value) =>
                                    form.setData(
                                        'graduation_year',
                                        value === '' ? null : Number(value),
                                    )
                                }
                            />
                            <div className="md:col-span-2">
                                <TextField
                                    id="advisor"
                                    label="Asesor académico"
                                    value={form.data.advisor}
                                    error={form.errors.advisor}
                                    onChange={(value) =>
                                        form.setData('advisor', value)
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
                        <Link
                            href={show_url}
                            className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-upel-cloud dark:hover:bg-muted"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-60"
                        >
                            {form.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
