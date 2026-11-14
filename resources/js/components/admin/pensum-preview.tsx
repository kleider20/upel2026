import { cn } from '@/lib/utils';
import type { PensumCareer, PensumPeriod } from '@/types/pensum';

type Props = {
    career: PensumCareer;
    pensum: PensumPeriod[];
};

/**
 * Vista previa del pensum con el formato oficial de la planilla UPEL.
 *
 * Replica la tabla del documento institucional: períodos agrupados, niveles
 * escritos en vertical y las columnas PA, CA/PA, CÓD, NOMBRES, COMP, TIPO,
 * AREA, NIVEL, CA, HAD, HLE, PREL y RE (AE/SC).
 */
export function PensumPreview({ career, pensum }: Props) {
    return (
        <article
            id="pensum-preview"
            className="pensum-print-document overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-sm sm:p-8 dark:bg-card"
        >
            <header className="relative pb-3 text-center text-black">
                <img
                    src="/images/upel-logo.png"
                    alt="Logotipo de la UPEL"
                    className="mx-auto mb-3 h-14 w-auto object-contain sm:absolute sm:top-0 sm:left-0 sm:mx-0 sm:mb-0"
                />
                <p className="text-[0.7rem] font-bold uppercase">
                    Universidad Pedagógica Experimental Libertador
                </p>
                <p className="text-[0.65rem] font-semibold uppercase">
                    Vicerrectorado de Docencia
                </p>
                <p className="text-[0.65rem] font-semibold uppercase">
                    Unidad de Currículo
                </p>
                <h2 className="mt-5 text-base font-bold uppercase">
                    Plan curricular de {career.name}
                </h2>
            </header>

            <div className="overflow-x-auto">
                <table className="pensum-print-table w-full min-w-[880px] table-fixed border-collapse text-[0.55rem] leading-[1.15] text-black">
                    <caption className="sr-only">
                        Vista previa del plan curricular de {career.name}
                    </caption>
                    <colgroup>
                        <col style={{ width: '2.48%' }} />
                        <col style={{ width: '5.31%' }} />
                        <col style={{ width: '5.62%' }} />
                        <col style={{ width: '43.3%' }} />
                        <col style={{ width: '5.12%' }} />
                        <col style={{ width: '5.73%' }} />
                        <col style={{ width: '4.86%' }} />
                        <col style={{ width: '5.02%' }} />
                        <col style={{ width: '2.96%' }} />
                        <col style={{ width: '3.78%' }} />
                        <col style={{ width: '3.51%' }} />
                        <col style={{ width: '4.57%' }} />
                        <col style={{ width: '2.58%' }} />
                        <col style={{ width: '5.14%' }} />
                    </colgroup>
                    <thead>
                        <tr className="text-center font-bold uppercase">
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                PA
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                CA/PA
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Cód
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Nombres
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Comp
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Tipo
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Area
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Nivel
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                CA
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                HAD
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                HLE
                            </th>
                            <th
                                rowSpan={2}
                                className="border border-black px-0.5 py-1"
                            >
                                Prel
                            </th>
                            <th
                                colSpan={2}
                                className="border border-black px-0.5 py-0.5"
                            >
                                RE
                            </th>
                        </tr>
                        <tr className="text-center font-bold uppercase">
                            <th className="border border-black px-0.5 py-0.5">
                                AE
                            </th>
                            <th className="border border-black px-0.5 py-0.5">
                                SC
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pensum.map((period) =>
                            period.subjects.map((subject, index) => (
                                <tr key={subject.id}>
                                    {index === 0 ? (
                                        <>
                                            <td
                                                rowSpan={period.subjects.length}
                                                className="border border-black text-center align-middle font-semibold"
                                            >
                                                {period.label}
                                            </td>
                                            <td
                                                rowSpan={period.subjects.length}
                                                className="border border-black text-center align-middle font-semibold"
                                            >
                                                {period.credits}
                                            </td>
                                        </>
                                    ) : null}
                                    <td
                                        className={cn(
                                            'border border-black px-1 py-[0.18rem] text-center break-words',
                                            subject.code.length > 12
                                                ? 'text-[0.42rem]'
                                                : 'text-[0.5rem]',
                                        )}
                                    >
                                        {subject.code}
                                    </td>
                                    <td className="border border-black px-1 py-[0.18rem]">
                                        {subject.name}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center">
                                        {subject.component ?? ''}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center">
                                        {subject.type ?? ''}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center" />
                                    {index === 0 ? (
                                        <td
                                            rowSpan={period.subjects.length}
                                            className="border border-black px-0.5 py-1 text-center align-middle"
                                        >
                                            <span className="flex flex-col items-center justify-center gap-0.5 text-[0.5rem] leading-none font-semibold">
                                                {(
                                                    period.subjects[0].level ??
                                                    ''
                                                )
                                                    .split('')
                                                    .map(
                                                        (
                                                            letter,
                                                            letterIndex,
                                                        ) => (
                                                            <span
                                                                key={`${letter}-${letterIndex}`}
                                                            >
                                                                {letter}
                                                            </span>
                                                        ),
                                                    )}
                                            </span>
                                        </td>
                                    ) : null}
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center">
                                        {subject.credits}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center">
                                        {subject.theory_hours}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center">
                                        {subject.practice_hours}
                                    </td>
                                    <td className="border border-black px-0.5 py-[0.18rem] text-center" />
                                    <td
                                        colSpan={2}
                                        className="border border-black px-0.5 py-[0.18rem]"
                                    />
                                </tr>
                            )),
                        )}
                        {pensum.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={14}
                                    className="border border-black px-3 py-6 text-center"
                                >
                                    Este pensum aún no tiene materias.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                    <tfoot>
                        <tr className="text-center font-bold">
                            <td colSpan={8} className="border border-black" />
                            <td className="border border-black px-0.5 py-1">
                                {career.credits_total}
                            </td>
                            <td colSpan={5} className="border border-black" />
                        </tr>
                    </tfoot>
                </table>
            </div>

            <p className="mt-3 text-[0.62rem] text-black">
                Nota: Las Unidades Curriculares de Libre Elección (UNCLE) serán
                variables según el período académico.
            </p>
        </article>
    );
}
