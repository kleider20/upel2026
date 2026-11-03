import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2, Save, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { update } from '@/routes/professor/grades';

type GradeTarget = {
    enrollment_id: number;
    student_name: string | null;
    student_code: string | null;
    subject_name: string;
    grade: number | null;
};

/**
 * Modal para que el profesor registre la nota final de un estudiante.
 */
export function GradeModal({
    open,
    onOpenChange,
    target,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: GradeTarget | null;
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        final_grade:
            target?.grade !== null && target?.grade !== undefined
                ? String(target.grade)
                : '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!target) {
            return;
        }

        put(update.url(target.enrollment_id), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset('final_grade');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold text-upel-navy">
                        Cargar nota
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Registra la calificación final sobre la escala de 0 a
                        10.
                    </DialogDescription>
                </DialogHeader>

                {target ? (
                    <div className="rounded-xl bg-upel-cloud px-4 py-3 text-xs dark:bg-muted">
                        <p className="font-bold text-upel-navy dark:text-foreground">
                            {target.student_name ?? 'Estudiante'}
                        </p>
                        <p className="mt-0.5 font-semibold text-muted-foreground">
                            {target.student_code ?? 'Sin código'} ·{' '}
                            {target.subject_name}
                        </p>
                    </div>
                ) : null}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="final-grade"
                            className="mb-1.5 block text-xs font-bold text-upel-navy dark:text-foreground"
                        >
                            Nota final
                        </label>
                        <input
                            id="final-grade"
                            type="number"
                            name="final_grade"
                            min={0}
                            max={10}
                            step={0.1}
                            required
                            autoFocus
                            value={data.final_grade}
                            onChange={(event) =>
                                setData('final_grade', event.target.value)
                            }
                            aria-invalid={Boolean(errors.final_grade)}
                            placeholder="Ej. 8,5"
                            className="h-12 w-full rounded-xl border border-border bg-upel-cloud/50 px-4 text-lg font-extrabold text-upel-navy focus:border-upel-blue focus:bg-white focus:outline-none dark:bg-background"
                        />
                        {errors.final_grade ? (
                            <p className="mt-1 text-[0.68rem] font-semibold text-red-600">
                                {errors.final_grade}
                            </p>
                        ) : null}
                        <p className="mt-1.5 text-[0.65rem] leading-relaxed text-muted-foreground">
                            La nota mínima aprobatoria es 5. Puedes usar
                            decimales, por ejemplo 8,5.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-upel-cloud"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-upel-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-upel-navy-800 disabled:cursor-wait disabled:opacity-70"
                        >
                            {processing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {processing ? 'Guardando…' : 'Guardar nota'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
