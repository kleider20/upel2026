import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
    label: string;
    invalid?: boolean;
};

/**
 * Campo de contraseña con el estilo de los formularios de acceso UPEL.
 */
export default function PasswordField({
    label,
    id,
    invalid = false,
    className,
    ...props
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-[0.72rem] font-extrabold text-upel-navy"
            >
                {label}
            </label>
            <div className="relative">
                <LockKeyhole
                    className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-upel-slate"
                    aria-hidden="true"
                />
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    aria-invalid={invalid}
                    className={cn(
                        'h-11 w-full rounded-[11px] border border-upel-mist bg-upel-cloud/50 pr-10 pl-9 text-sm font-medium text-upel-navy placeholder:text-upel-slate/50 focus:border-upel-blue focus:bg-white focus:outline-none',
                        className,
                    )}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((previous) => !previous)}
                    aria-label={
                        visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                    className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-upel-slate transition-colors hover:text-upel-navy focus-visible:text-upel-navy focus-visible:outline-none"
                >
                    {visible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                        <Eye className="size-4" aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
}
