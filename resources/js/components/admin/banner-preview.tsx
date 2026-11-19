import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import {
    HeroSlideStage,
    type HeroSlide,
} from '@/components/landing/hero-slider';

/** Medidas del lienzo del baner público; la vista previa se escala a este tamaño. */
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

type Props = {
    slide: HeroSlide;
};

/**
 * Vista previa en vivo del baner de la landing. Reutiliza el mismo componente
 * de diapositiva que la página pública para mostrar el resultado real antes
 * de publicar la diapositiva.
 */
export function BannerPreview({ slide }: Props) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        const updateScale = () => setScale(frame.clientWidth / STAGE_WIDTH);
        updateScale();

        const observer = new ResizeObserver(updateScale);
        observer.observe(frame);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071b30] shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0a2540] px-4 py-2.5">
                <p className="flex items-center gap-2 text-[0.66rem] font-extrabold tracking-[0.14em] text-upel-gold-light uppercase">
                    <Eye className="size-3.5" aria-hidden="true" />
                    Vista previa
                </p>
                <p className="text-[0.62rem] font-semibold text-white/45">
                    Así se verá en el inicio
                </p>
            </div>

            <div
                ref={frameRef}
                className="relative w-full overflow-hidden"
                style={{ height: STAGE_HEIGHT * scale }}
            >
                <div
                    className="absolute top-0 left-0"
                    style={{
                        width: STAGE_WIDTH,
                        height: STAGE_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                >
                    <section
                        aria-label="Vista previa del baner"
                        className="relative isolate flex h-full w-full items-center overflow-hidden bg-[linear-gradient(125deg,#071b30_0%,#0a2540_42%,#113a63_100%)]"
                    >
                        <div
                            className="upel-grid absolute inset-0 -z-10 opacity-70"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute -top-24 -left-32 -z-10 size-[30rem] rounded-full bg-upel-blue/25 blur-[120px]"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute top-1/3 -right-40 -z-10 size-[34rem] rounded-full bg-upel-gold/12 blur-[130px]"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute bottom-0 left-1/3 -z-10 h-64 w-64 rounded-full bg-upel-green/10 blur-[100px]"
                            aria-hidden="true"
                        />

                        <div className="mx-auto w-full max-w-[1280px] px-8 py-16">
                            <HeroSlideStage slide={slide} preview />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
