import { formatScore, type GradingLimits } from '@/lib/evaluation-plan';

export type EvaluationSheetHeader = {
    profesor: string;
    cedula: string | null;
    programa: string;
    sede: string;
    especialidad: string;
    especialidad_codigo: string | null;
    curso: string;
    periodo: string;
    horario: string;
    ambiente: string;
    cohorte: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
};

export type EvaluationSheetItem = {
    id: number;
    position: number;
    title: string;
    content: string | null;
    weight: number;
    scheduled_on: string;
};

export type EvaluationSheetRow = {
    student_id: number;
    enrollment_id: number | null;
    enrolled: boolean;
    student_name: string;
    student_code: string | null;
    id_number: string | null;
    semester: number | null;
    cohort: string | null;
    current_cohort: string | null;
    career_code: string | null;
    scores: Record<string, number | null>;
    definitive: number | null;
    definitive_ten: number | null;
};

type Props = {
    header: EvaluationSheetHeader;
    items: EvaluationSheetItem[];
    rows: EvaluationSheetRow[];
    totalWeight: number;
    limits: GradingLimits;
};

const cellClass = 'border border-black px-1 py-[3px] align-middle';
const headCellClass =
    'border border-black bg-black/[0.05] px-1 py-[3px] text-center align-middle';

/**
 * Vista previa imprimible del plan de evaluación con el formato oficial de
 * Control de Estudios: cabecera de identificación, evaluaciones programadas y
 * el control de notas por estudiante.
 */
export function EvaluationPlanSheet({
    header,
    items,
    rows,
    totalWeight,
    limits,
}: Props) {
    const headerFields: { label: string; value: string | null }[] = [
        { label: 'Profesor', value: header.profesor },
        { label: 'Cédula', value: header.cedula },
        { label: 'Programa', value: header.programa },
        { label: 'Sede/Extensión', value: header.sede },
        {
            label: 'Especialidad',
            value: header.especialidad_codigo
                ? `${header.especialidad} (${header.especialidad_codigo})`
                : header.especialidad,
        },
        { label: 'Curso', value: header.curso },
        { label: 'Período Académico', value: header.periodo },
        { label: 'Horario', value: header.horario },
        { label: 'Ambiente', value: header.ambiente },
        { label: 'Cohorte', value: header.cohorte },
        { label: 'Fecha de inicio', value: header.fecha_inicio },
        { label: 'Fecha de fin', value: header.fecha_fin },
    ];

    return (
        <article className="evaluation-sheet-document mx-auto w-full max-w-[900px] border border-black bg-white px-5 py-4 font-serif text-[0.66rem] leading-snug text-black">
            <header className="relative text-center">
                <img
                    src="/images/upel-logo.png"
                    alt="Logotipo de la UPEL"
                    className="mx-auto mb-2 h-16 w-auto object-contain sm:absolute sm:top-0 sm:left-0 sm:mx-0 sm:mb-0"
                />
                <p>República Bolivariana de Venezuela</p>
                <p>Ministerio del Poder Popular para la Educación Superior</p>
                <p>Universidad Pedagógica Experimental Libertador</p>
                <p>Secretaría - Control de Estudios</p>
                <p className="mt-2 text-[0.78rem] font-bold tracking-[0.12em] uppercase">
                    Plan de evaluación
                </p>
            </header>

            <dl className="mt-3 grid grid-cols-2 border-t border-l border-black">
                {headerFields.map((field) => (
                    <div
                        key={field.label}
                        className="flex border-r border-b border-black"
                    >
                        <dt className="w-[42%] border-r border-black px-1.5 py-[3px] font-bold">
                            {field.label}:
                        </dt>
                        <dd className="flex-1 px-1.5 py-[3px]">
                            {field.value ?? '—'}
                        </dd>
                    </div>
                ))}
            </dl>

            <section className="mt-3">
                <p className="text-[0.62rem] font-bold tracking-[0.1em] uppercase">
                    Evaluaciones programadas
                </p>
                <table className="mt-1 w-full border-collapse">
                    <thead>
                        <tr>
                            <th className={`${headCellClass} w-8`}>N°</th>
                            <th className={`${headCellClass} text-left`}>
                                Evaluación
                            </th>
                            <th className={`${headCellClass} text-left`}>
                                Contenido
                            </th>
                            <th className={`${headCellClass} w-20`}>Fecha</th>
                            <th className={`${headCellClass} w-20`}>
                                Ponderación
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className={`${cellClass} text-center`}
                                >
                                    Sin evaluaciones registradas.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id}>
                                    <td className={`${cellClass} text-center`}>
                                        {item.position}
                                    </td>
                                    <td
                                        className={`${cellClass} font-semibold`}
                                    >
                                        {item.title}
                                    </td>
                                    <td className={cellClass}>
                                        {item.content ?? '—'}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        {item.scheduled_on}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        {item.weight} %
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-black/[0.05] font-bold">
                            <td
                                colSpan={4}
                                className={`${cellClass} text-right`}
                            >
                                Total ponderado
                            </td>
                            <td className={`${cellClass} text-center`}>
                                {totalWeight} %
                            </td>
                        </tr>
                    </tfoot>
                </table>
                {totalWeight === limits.total_weight ? null : (
                    <p className="mt-1 text-[0.6rem] font-semibold">
                        Ponderación acumulada: {totalWeight} % de{' '}
                        {limits.total_weight} %.
                    </p>
                )}
            </section>

            <section className="mt-3">
                <p className="text-[0.62rem] font-bold tracking-[0.1em] uppercase">
                    Control de notas
                </p>
                <table className="evaluation-sheet-table mt-1 w-full border-collapse">
                    <thead>
                        <tr>
                            <th className={`${headCellClass} w-7`}>N°</th>
                            <th className={`${headCellClass} w-8`}>Sec.</th>
                            <th className={`${headCellClass} w-10`}>Esp.</th>
                            <th className={`${headCellClass} w-12`}>Cohorte</th>
                            <th className={`${headCellClass} w-20`}>Cédula</th>
                            <th className={`${headCellClass} text-left`}>
                                Nombre y Apellidos
                            </th>
                            {items.map((item) => (
                                <th
                                    key={item.id}
                                    className={`${headCellClass} w-10`}
                                >
                                    <span className="flex h-24 flex-col items-center justify-end gap-1">
                                        <span className="rotate-180 text-[0.56rem] font-semibold whitespace-nowrap [writing-mode:vertical-rl]">
                                            {item.title}
                                        </span>
                                        <span className="text-[0.56rem] font-bold">
                                            {item.weight} %
                                        </span>
                                    </span>
                                </th>
                            ))}
                            <th className={`${headCellClass} w-14`}>
                                Nota Final
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7 + items.length}
                                    className={`${cellClass} text-center`}
                                >
                                    Sin estudiantes inscritos.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr key={row.student_id}>
                                    <td className={`${cellClass} text-center`}>
                                        {index + 1}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        {row.semester ?? '—'}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        {row.career_code ?? '—'}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        <span className="block">
                                            {row.current_cohort ?? '—'}
                                        </span>
                                        {row.cohort !== null &&
                                        row.cohort !== row.current_cohort ? (
                                            <span className="block text-[0.55rem]">
                                                {row.cohort}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className={`${cellClass} text-center`}>
                                        {row.id_number ??
                                            row.student_code ??
                                            '—'}
                                    </td>
                                    <td className={`${cellClass} uppercase`}>
                                        {row.student_name}
                                    </td>
                                    {items.map((item) => (
                                        <td
                                            key={item.id}
                                            className={`${cellClass} text-center`}
                                        >
                                            {formatScore(
                                                row.scores[String(item.id)] ??
                                                    null,
                                            )}
                                        </td>
                                    ))}
                                    <td
                                        className={`${cellClass} text-center font-bold`}
                                    >
                                        {formatScore(row.definitive_ten)}
                                        <span className="block text-[0.55rem] font-normal">
                                            {formatScore(row.definitive)} /{' '}
                                            {limits.max_item_score}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <p className="mt-1 text-[0.58rem]">
                    Notas por evaluación sobre {limits.max_item_score} · nota
                    final sobre {limits.final_scale} · mínima aprobatoria{' '}
                    {limits.passing_grade}.
                </p>
            </section>

            <footer className="mt-10 grid grid-cols-2 gap-10 text-center text-[0.62rem]">
                <div className="border-t border-black pt-1">
                    <p className="font-bold uppercase">{header.profesor}</p>
                    <p>Profesor</p>
                </div>
                <div className="border-t border-black pt-1">
                    <p className="font-bold uppercase">Control de Estudios</p>
                    <p>{header.sede}</p>
                </div>
            </footer>
        </article>
    );
}
