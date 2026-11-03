import { cn } from '@/lib/utils';

const roleStyles: Record<string, string> = {
    estudiante: 'bg-upel-blue/10 text-upel-blue ring-upel-blue/20',
    profesor: 'bg-upel-green/10 text-upel-green ring-upel-green/20',
    graduado: 'bg-upel-gold/15 text-[#8a6c0d] ring-upel-gold/30',
    admin: 'bg-upel-navy text-white ring-upel-navy',
    decano: 'bg-upel-navy/10 text-upel-navy ring-upel-navy/20 dark:bg-upel-blue-300/15 dark:text-upel-blue-300',
    coordinador_academico: 'bg-upel-blue/10 text-upel-blue ring-upel-blue/20',
    personal_administrativo: 'bg-upel-green/10 text-upel-green ring-upel-green/20',
};

/**
 * Insignia del rol principal del usuario.
 */
export function RoleBadge({
    role,
    label,
    className,
}: {
    role?: string | null;
    label?: string | null;
    className?: string;
}) {
    if (!role && !label) {
        return null;
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.12em] uppercase ring-1 ring-inset',
                roleStyles[role ?? ''] ?? 'bg-slate-100 text-slate-700 ring-slate-200',
                className,
            )}
        >
            {label ?? role}
        </span>
    );
}
