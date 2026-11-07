import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { teachers } from '@/data/teachers';
import { TeacherAvatar } from '@/components/landing/brand';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

/** Cantidad de tarjetas visibles según el ancho de pantalla. */
function getItemsPerView(width: number): number {
    if (width < 640) {
        return 1;
    }

    if (width < 768) {
        return 2;
    }

    if (width < 1024) {
        return 3;
    }

    if (width < 1280) {
        return 4;
    }

    return 5;
}

export function Teachers() {
    const [page, setPage] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(5);

    useEffect(() => {
        const update = () =>
            setItemsPerView(getItemsPerView(window.innerWidth));

        update();
        window.addEventListener('resize', update);

        return () => window.removeEventListener('resize', update);
    }, []);

    const pageCount = Math.max(1, Math.ceil(teachers.length / itemsPerView));

    useEffect(() => {
        setPage(0);
    }, [itemsPerView]);

    const next = useCallback(() => {
        setPage((current) => (current + 1) % pageCount);
    }, [pageCount]);

    const previous = useCallback(() => {
        setPage((current) => (current - 1 + pageCount) % pageCount);
    }, [pageCount]);

    return (
        <section
            id="profesores"
            className="scroll-mt-24 bg-upel-cloud py-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Nuestro claustro"
                            title="Profesionales que inspiran"
                            description="Un equipo multidisciplinario de doctores, magísteres y especialistas comprometidos con la formación de la próxima generación de educadores."
                            className="max-w-2xl"
                        />

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={previous}
                                aria-label="Profesores anteriores"
                                className="inline-flex size-11 items-center justify-center rounded-full border border-upel-mist bg-white text-upel-navy transition-colors hover:border-upel-navy/25 hover:bg-upel-cloud"
                            >
                                <ArrowLeft
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                aria-label="Siguientes profesores"
                                className="inline-flex size-11 items-center justify-center rounded-full border border-upel-mist bg-white text-upel-navy transition-colors hover:border-upel-navy/25 hover:bg-upel-cloud"
                            >
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={80}>
                    <div
                        className="mt-10 overflow-hidden outline-none"
                        tabIndex={0}
                        aria-roledescription="carrusel"
                        aria-label="Slider de profesores"
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight') {
                                event.preventDefault();
                                next();
                            }

                            if (event.key === 'ArrowLeft') {
                                event.preventDefault();
                                previous();
                            }
                        }}
                    >
                        <div
                            className="-mx-2.5 flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${page * 100}%)` }}
                        >
                            {teachers.map((teacher) => (
                                <div
                                    key={teacher.id}
                                    className="w-full shrink-0 px-2.5 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5"
                                >
                                    <article className="group flex h-full flex-col items-center rounded-[20px] border border-upel-mist bg-white p-5 text-center shadow-[0_8px_24px_-20px_rgba(10,37,64,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-upel-gold/35 hover:shadow-[0_24px_44px_-26px_rgba(10,37,64,0.35)]">
                                        <div className="relative">
                                            <TeacherAvatar
                                                teacher={teacher}
                                                className="size-24 rounded-full ring-4 ring-upel-cloud transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <span
                                                className="absolute right-1 bottom-1 size-3.5 rounded-full border-2 border-white bg-upel-green"
                                                aria-label="Disponible"
                                            />
                                        </div>

                                        <h3 className="mt-4 text-[0.92rem] leading-tight font-extrabold text-upel-navy">
                                            {teacher.name}
                                        </h3>
                                        <p className="mt-1 text-[0.65rem] font-extrabold tracking-wide text-upel-gold uppercase">
                                            {teacher.role}
                                        </p>
                                        <p className="mt-2 flex-1 text-[0.72rem] leading-relaxed text-upel-slate">
                                            {teacher.description}
                                        </p>

                                        <div className="mt-4 flex items-center gap-2 border-t border-upel-mist pt-3">
                                            <a
                                                href={`mailto:${teacher.email}`}
                                                aria-label={`Enviar correo a ${teacher.name}`}
                                                className="inline-flex size-8 items-center justify-center rounded-full bg-upel-cloud text-upel-slate transition-colors hover:bg-upel-navy hover:text-white"
                                            >
                                                <Mail
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                            <a
                                                href="#profesores"
                                                aria-label={`Ver perfil de ${teacher.name}`}
                                                className="inline-flex size-8 items-center justify-center rounded-full bg-upel-cloud text-upel-slate transition-colors hover:bg-upel-navy hover:text-white"
                                            >
                                                <UserRound
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </div>
                                    </article>
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                <div className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: pageCount }).map((_, pageIndex) => (
                        <button
                            key={pageIndex}
                            type="button"
                            onClick={() => setPage(pageIndex)}
                            aria-label={`Ir a la página ${pageIndex + 1} de profesores`}
                            aria-current={page === pageIndex}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                page === pageIndex
                                    ? 'w-9 bg-upel-gold'
                                    : 'w-2 bg-upel-navy/15 hover:bg-upel-navy/30',
                            )}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
