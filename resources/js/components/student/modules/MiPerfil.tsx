import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, Download, Edit3, Lock, ShieldCheck, UserRound } from 'lucide-react';
import { ToneBadge, type Tone } from '@/components/portal/tone-badge';
import type { Auth } from '@/types';
import type { StudentDashboardProps } from '@/types/student';
import { update as updateProfile } from '@/routes/student/profile';

export function MiPerfil({ profile, admission, summary }: StudentDashboardProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const user = auth.user;

  const [isEditing, setIsEditing] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    phone: profile?.phone ?? '',
    personal_email: profile?.personal_email ?? user?.email ?? '',
    address: profile?.address ?? '',
    emergency_contact: profile?.emergency_contact ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(updateProfile.url(), {
      preserveScroll: true,
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleDownloadConstancia = () => {
    alert('Generando constancia de estudios en PDF (Demo)...');
  };

  return (
    <div className="space-y-6">
      {/* Hero del perfil */}
      <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0a2540_0%,#113a63_50%,#1e5fa8_100%)] p-6 text-white shadow-xl sm:p-8">
        <div className="upel-grid absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-16 -right-16 h-60 w-60 rounded-full bg-upel-gold/20 blur-[70px]" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-upel-gold font-display text-3xl font-extrabold text-upel-navy shadow-lg ring-4 ring-white/20">
              {user?.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() ?? 'UP'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.62rem] font-bold text-upel-gold-light uppercase backdrop-blur-md">
                  Estudiante activo
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[0.62rem] font-bold text-emerald-300 backdrop-blur-md">
                  ✓ Verificado
                </span>
              </div>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {user?.name ?? 'María Fernández'}
              </h2>
              <p className="mt-1 text-xs text-white/75">
                Expediente: <strong className="text-white">{profile?.student_code ?? 'E-2024-00121'}</strong> · {profile?.career ?? 'Educación Integral'} · Semestre {profile?.current_semester ?? 5}°
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 rounded-xl bg-upel-gold px-4 py-2.5 text-xs font-extrabold text-upel-navy shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-upel-gold-light"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Cancelar edición' : 'Editar perfil'}
            </button>
            <button
              type="button"
              onClick={handleDownloadConstancia}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Constancia de estudios
            </button>
          </div>
        </div>
      </div>

      {/* Stats chips (4) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
          <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Promedio general</p>
          <p className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            {summary.average !== null ? summary.average.toFixed(1).replace('.', ',') : '—'} <span className="text-xs font-semibold text-muted-foreground">/ 20</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
          <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Créditos aprobados</p>
          <p className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            {summary.credits_approved} <span className="text-xs font-semibold text-muted-foreground">U.C.</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
          <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Materias aprobadas</p>
          <p className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            {summary.approved_count} / {summary.subjects_count}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
          <p className="text-[0.62rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">Período de ingreso</p>
          <p className="font-display mt-1 text-xl font-bold text-upel-navy dark:text-foreground">
            {profile?.period_year ?? profile?.admission_year ?? '—'}
          </p>
        </div>
      </div>

      {/* Grid paneles: Datos personales + Académico y seguridad */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel izquierdo: Datos personales (editable/vista) */}
        <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground">Datos Personales y de Contacto</h3>
            <span className="text-xs font-semibold text-muted-foreground">{isEditing ? 'Modo edición' : 'Solo lectura'}</span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">Teléfono móvil</label>
                <input
                  type="text"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                />
                {errors.phone && <p className="mt-1 text-[0.68rem] font-semibold text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">Correo personal</label>
                <input
                  type="email"
                  value={data.personal_email}
                  onChange={(e) => setData('personal_email', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                />
                {errors.personal_email && <p className="mt-1 text-[0.68rem] font-semibold text-red-600">{errors.personal_email}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">Dirección de habitación</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                />
                {errors.address && <p className="mt-1 text-[0.68rem] font-semibold text-red-600">{errors.address}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-upel-navy dark:text-foreground">Contacto de emergencia</label>
                <input
                  type="text"
                  value={data.emergency_contact}
                  onChange={(e) => setData('emergency_contact', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-upel-cloud/50 px-3 text-xs font-semibold text-upel-navy focus:border-upel-blue focus:outline-none dark:bg-muted dark:text-foreground"
                />
                {errors.emergency_contact && <p className="mt-1 text-[0.68rem] font-semibold text-red-600">{errors.emergency_contact}</p>}
              </div>

              <div className="rounded-xl bg-upel-cloud p-3 text-[0.7rem] text-muted-foreground dark:bg-muted">
                🔒 Por seguridad, los campos de identidad (Cédula y Nombre completo) no son editables directamente desde el portal. Contacta a control de estudios si requieres modificarlos.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-upel-navy hover:bg-upel-cloud dark:text-foreground dark:hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-xl bg-upel-navy px-5 py-2 text-xs font-bold text-white hover:bg-upel-navy-800 disabled:opacity-50"
                >
                  {processing ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-5 space-y-4 text-xs">
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Nombre completo:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{user?.name ?? 'María Fernández'}</dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Cédula de identidad:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.id_number ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Fecha y lugar de nacimiento:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">
                  {profile?.birth_date ?? '—'}
                  {profile?.birth_place ? ` · ${profile.birth_place}` : ''}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Teléfono:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{data.phone}</dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Correo personal:</dt>
                <dd className="font-bold text-upel-blue">{data.personal_email}</dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2.5">
                <dt className="text-muted-foreground">Dirección:</dt>
                <dd className="max-w-[220px] truncate text-right font-bold text-upel-navy dark:text-foreground">{data.address}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Contacto de emergencia:</dt>
                <dd className="max-w-[220px] truncate text-right font-bold text-upel-navy dark:text-foreground">{data.emergency_contact}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Panel derecho: Información académica + Seguridad */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
            <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground border-b border-border pb-4">Información Académica</h3>
            <dl className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expediente:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.student_code ?? 'E-2024-00121'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Carrera:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.career ?? 'Educación Integral'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Período de ingreso:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.period_year ?? profile?.admission_year ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Semestre actual:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.current_semester ?? '—'}°</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Turno:</dt>
                <dd className="font-bold text-upel-navy dark:text-foreground">{profile?.shift ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Solicitud de admisión:</dt>
                <dd className="font-bold text-upel-blue">{admission?.code ?? profile?.admission_code ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Asesor académico:</dt>
                <dd className="font-bold text-upel-blue">{profile?.advisor ?? 'Por asignar'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm dark:bg-card">
            <h3 className="font-display text-base font-bold text-upel-navy dark:text-foreground border-b border-border pb-4">Seguridad de la Cuenta</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Correo institucional:</span>
                <span className="font-bold text-upel-navy dark:text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rol de acceso:</span>
                <span className="font-bold text-upel-blue uppercase">Estudiante</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado de verificación:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" /> 2FA Activado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
