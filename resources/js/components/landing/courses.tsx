import {
    Brain,
    ClipboardCheck,
    Clock3,
    HeartPulse,
    Mic2,
    MonitorPlay,
    Sparkles,
    Timer,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { courses, type CourseIcon } from '@/data/courses';
import { Reveal } from '@/components/landing/reveal';
import { SectionHeading } from '@/components/landing/ui/section-heading';

const courseIcons: Record<CourseIcon, LucideIcon> = {
    monitor: MonitorPlay,
    brain: Brain,
    checklist: ClipboardCheck,
    mic: Mic2,
    sparkles: Sparkles,
    heart: HeartPulse,
};

/**
 * Cursos y talleres de extensión académica.
 */
export function Courses() {
    return (
        <section id="cursos" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="Formación continua"
                        title="Cursos y talleres para crecer profesionalmente"
                        description="Programas cortos, prácticos y certificados por la UPEL. Actualiza tus competencias docentes sin interrumpir tu vida laboral."
                    />
                </Reveal>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course, index) => {
                        const Icon = courseIcons[course.icon];

                        return (
                            <Reveal key={course.id} delay={index * 70}>
                                <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-upel-mist bg-white shadow-[0_10px_28px_-22px_rgba(10,37,64,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-30px_rgba(10,37,64,0.4)]">
                                    <div
                                        className="relative flex h-36 items-center justify-between overflow-hidden px-6"
                                        style={{ backgroundImage: course.gradient }}
                                    >
                                        <div
                                            className="absolute -top-10 -right-8 size-36 rounded-full bg-white/10"
                                            aria-hidden="true"
                                        />
                                        <div
                                            className="absolute -bottom-12 -left-6 size-32 rounded-full bg-white/8"
                                            aria-hidden="true"
                                        />
                                        <span className="relative z-10 rounded-full bg-white/18 px-3 py-1 text-[0.6rem] font-extrabold tracking-wide text-white uppercase backdrop-blur-sm">
                                            {course.modality}
                                        </span>
                                        <span className="relative z-10 font-display text-4xl font-bold text-white/20">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="absolute right-5 bottom-4 flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                                            <Icon className="size-6" aria-hidden="true" />
                                        </span>
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <h3 className="font-display text-xl leading-snug font-bold text-upel-navy">
                                            {course.name}
                                        </h3>
                                        <p className="mt-2 flex-1 text-[0.83rem] leading-relaxed text-upel-slate">
                                            {course.description}
                                        </p>

                                        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-upel-mist pt-4">
                                            <div>
                                                <p className="text-[0.55rem] font-extrabold tracking-widest text-upel-slate/70 uppercase">
                                                    Duración
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] font-bold text-upel-navy">
                                                    <Clock3 className="size-3 text-upel-blue" aria-hidden="true" />
                                                    {course.duration}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[0.55rem] font-extrabold tracking-widest text-upel-slate/70 uppercase">
                                                    Carga
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] font-bold text-upel-navy">
                                                    <Timer className="size-3 text-upel-blue" aria-hidden="true" />
                                                    {course.hours} h
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[0.55rem] font-extrabold tracking-widest text-upel-slate/70 uppercase">
                                                    Inversión
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-0.5 text-[0.72rem] font-extrabold',
                                                        course.price === 'Certificado'
                                                            ? 'text-upel-green'
                                                            : 'text-upel-navy',
                                                    )}
                                                >
                                                    {course.price}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Reveal>
                        );
                    })}
                </div>

                <Reveal delay={160}>
                    <p className="mt-10 text-center text-sm text-upel-slate">
                        ¿Tu institución necesita una formación a medida?{' '}
                        <a href="#contacto" className="font-extrabold text-upel-blue hover:text-upel-navy">
                            Solicita un programa corporativo
                        </a>
                        .
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
