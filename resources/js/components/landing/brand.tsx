import { cn } from '@/lib/utils';
import type { Teacher } from '@/data/teachers';

/* -------------------------------------------------------------------------- */
/*                              Logos oficiales                               */
/* -------------------------------------------------------------------------- */

/**
 * Lockup horizontal de la UPEL: símbolo oficial + wordmark.
 * Se usa en la barra de navegación, el pie de página y el modal de acceso.
 */
export function UpelLogo({
    variant = 'dark',
    className,
}: {
    variant?: 'light' | 'dark';
    className?: string;
}) {
    const isLight = variant === 'light';

    return (
        <span
            className={cn('inline-flex items-center gap-2.5', className)}
            role="img"
            aria-label="Universidad Pedagógica Experimental Libertador"
        >
            <img
                src="/images/upel-mark.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className={cn(
                    'h-full w-auto shrink-0 select-none',
                    isLight && 'brightness-125',
                )}
            />
            <span className="flex flex-col justify-center">
                <span
                    className={cn(
                        'text-[1.35rem] leading-none font-extrabold tracking-[0.04em]',
                        isLight ? 'text-white' : 'text-upel-navy',
                    )}
                >
                    UPEL
                </span>
                <span
                    className={cn(
                        'mt-[3px] text-[0.38rem] leading-[1.3] font-bold tracking-[0.12em]',
                        isLight ? 'text-[#cfe0f5]' : 'text-upel-slate',
                    )}
                >
                    UNIVERSIDAD PEDAGÓGICA
                    <br />
                    EXPERIMENTAL LIBERTADOR
                </span>
            </span>
        </span>
    );
}

/**
 * Sello oficial completo de la UPEL (símbolo + wordmark + nombre).
 * Pensado para fondos claros y tamaños grandes.
 */
export function UpelSeal({ className }: { className?: string }) {
    return (
        <img
            src="/images/upel-logo.png"
            alt="Universidad Pedagógica Experimental Libertador"
            draggable={false}
            className={cn('w-auto object-contain select-none', className)}
        />
    );
}

/**
 * Lockup horizontal del IMPM: emblema oficial + wordmark.
 * Se usa en el pie de página y en la sección institucional.
 */
export function ImpmLogo({
    variant = 'dark',
    className,
}: {
    variant?: 'light' | 'dark';
    className?: string;
}) {
    const isLight = variant === 'light';

    return (
        <span
            className={cn('inline-flex items-center gap-2.5', className)}
            role="img"
            aria-label="Instituto de Mejoramiento Profesional del Magisterio"
        >
            <img
                src="/images/impm-mark.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className={cn(
                    'h-full w-auto shrink-0 select-none',
                    isLight && 'brightness-125',
                )}
            />
            <span className="flex flex-col justify-center">
                <span
                    className={cn(
                        'text-[1.25rem] leading-none font-extrabold tracking-[0.04em]',
                        isLight ? 'text-white' : 'text-upel-navy',
                    )}
                >
                    IMPM
                </span>
                <span
                    className={cn(
                        'mt-[3px] text-[0.36rem] leading-[1.3] font-bold tracking-[0.1em]',
                        isLight ? 'text-[#cfe0f5]' : 'text-upel-slate',
                    )}
                >
                    INSTITUTO DE MEJORAMIENTO
                    <br />
                    PROFESIONAL DEL MAGISTERIO
                </span>
            </span>
        </span>
    );
}

/**
 * Sello oficial completo del IMPM (emblema + nombre).
 * Pensado para fondos claros y tamaños grandes.
 */
export function ImpmSeal({ className }: { className?: string }) {
    return (
        <img
            src="/images/impm-logo.png"
            alt="Instituto de Mejoramiento Profesional del Magisterio"
            draggable={false}
            className={cn('w-auto object-contain select-none', className)}
        />
    );
}

/* -------------------------------------------------------------------------- */
/*                         Ilustración del campus                             */
/* -------------------------------------------------------------------------- */

export function CampusIllustration({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 640 480"
            className={cn('h-auto w-full', className)}
            role="img"
            aria-label="Ilustración del campus universitario de la UPEL"
        >
            <defs>
                <linearGradient id="campus-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dcecfb" />
                    <stop offset="100%" stopColor="#f6f8fa" />
                </linearGradient>
                <linearGradient
                    id="campus-building"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0%" stopColor="#113a63" />
                    <stop offset="100%" stopColor="#1e5fa8" />
                </linearGradient>
            </defs>

            <rect width="640" height="480" rx="28" fill="url(#campus-sky)" />

            {/* Sol y nubes */}
            <circle cx="524" cy="96" r="46" fill="#e8c15a" opacity="0.35" />
            <circle cx="524" cy="96" r="30" fill="#e8c15a" />
            <g fill="#ffffff" opacity="0.85">
                <ellipse cx="128" cy="94" rx="48" ry="17" />
                <ellipse cx="164" cy="86" rx="32" ry="14" />
                <ellipse cx="348" cy="62" rx="38" ry="13" />
            </g>

            {/* Colinas */}
            <path
                d="M0 330c86-54 168-54 252-14s164 36 236-4 112-30 152-8v176H0V330Z"
                fill="#d7e8d8"
            />
            <path
                d="M0 366c90-42 178-38 262 2s170 26 238-8 96-24 140-4v124H0V366Z"
                fill="#c3ddc7"
            />

            {/* Edificio principal */}
            <g>
                <rect
                    x="164"
                    y="196"
                    width="312"
                    height="172"
                    rx="6"
                    fill="url(#campus-building)"
                />
                <rect
                    x="146"
                    y="184"
                    width="348"
                    height="20"
                    rx="6"
                    fill="#0a2540"
                />
                <path d="M320 132 146 184h348L320 132Z" fill="#0a2540" />
                <rect
                    x="304"
                    y="150"
                    width="32"
                    height="34"
                    rx="4"
                    fill="#c9a227"
                />
                <circle cx="320" cy="167" r="9" fill="#0a2540" />
                <path
                    d="M320 158v9l6 4"
                    stroke="#e8c15a"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Columnas */}
                {[196, 236, 276, 356, 396, 436].map((x) => (
                    <rect
                        key={x}
                        x={x}
                        y="208"
                        width="14"
                        height="128"
                        rx="3"
                        fill="#e6eaf0"
                        opacity="0.9"
                    />
                ))}

                {/* Ventanas */}
                {[212, 260, 380, 428].map((x) =>
                    [224, 272, 320].map((y) => (
                        <rect
                            key={`${x}-${y}`}
                            x={x}
                            y={y}
                            width="20"
                            height="24"
                            rx="3"
                            fill="#6da8e8"
                            opacity="0.55"
                        />
                    )),
                )}

                {/* Puerta */}
                <rect
                    x="300"
                    y="290"
                    width="40"
                    height="78"
                    rx="20"
                    fill="#0a2540"
                />
                <rect
                    x="307"
                    y="298"
                    width="26"
                    height="62"
                    rx="13"
                    fill="#c9a227"
                    opacity="0.85"
                />

                {/* Escalinatas */}
                <rect
                    x="270"
                    y="368"
                    width="100"
                    height="8"
                    rx="4"
                    fill="#e6eaf0"
                />
                <rect
                    x="256"
                    y="376"
                    width="128"
                    height="8"
                    rx="4"
                    fill="#e6eaf0"
                />
                <rect
                    x="242"
                    y="384"
                    width="156"
                    height="8"
                    rx="4"
                    fill="#e6eaf0"
                />
            </g>

            {/* Bandera */}
            <rect
                x="132"
                y="150"
                width="4"
                height="220"
                rx="2"
                fill="#5f6b7a"
            />
            <path d="M136 154h52v34h-52z" fill="#c9a227" />
            <path d="M136 188h52v34h-52z" fill="#1e5fa8" />
            <path d="M136 222h52v34h-52z" fill="#c94f5e" />

            {/* Árboles */}
            {[
                { x: 82, y: 340, s: 1 },
                { x: 566, y: 330, s: 1.15 },
                { x: 514, y: 352, s: 0.85 },
            ].map((tree) => (
                <g
                    key={tree.x}
                    transform={`translate(${tree.x} ${tree.y}) scale(${tree.s})`}
                >
                    <rect
                        x="-5"
                        y="0"
                        width="10"
                        height="52"
                        rx="4"
                        fill="#7a5a3a"
                    />
                    <circle cx="0" cy="-12" r="34" fill="#12876f" />
                    <circle cx="-22" cy="2" r="24" fill="#1aa387" />
                    <circle cx="22" cy="2" r="24" fill="#0f7a64" />
                </g>
            ))}

            {/* Personas */}
            <g>
                <circle cx="424" cy="400" r="9" fill="#c98d63" />
                <path d="M412 430c0-9 5-16 12-16s12 7 12 16" fill="#0a2540" />
                <circle cx="458" cy="406" r="8" fill="#e8b48f" />
                <path d="M447 432c0-8 5-14 11-14s11 6 11 14" fill="#c9a227" />
                <circle cx="206" cy="404" r="8" fill="#a86b45" />
                <path d="M195 432c0-8 5-14 11-14s11 6 11 14" fill="#12876f" />
            </g>
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*                        Avatares SVG de profesores                          */
/* -------------------------------------------------------------------------- */

export function TeacherAvatar({
    teacher,
    className,
}: {
    teacher: Teacher;
    className?: string;
}) {
    const { palette, gender, glasses, name } = teacher;

    return (
        <svg
            viewBox="0 0 160 160"
            className={cn('h-auto w-full', className)}
            role="img"
            aria-label={`Retrato ilustrado de ${name}`}
        >
            <rect width="160" height="160" rx="80" fill={palette.background} />
            <circle cx="80" cy="78" r="56" fill="#ffffff" opacity="0.4" />

            {/* Hombros y torso */}
            <path
                d="M22 160c0-30 24-50 58-50s58 20 58 50H22Z"
                fill={palette.outfit}
            />
            <path
                d="M66 112c4 8 8 12 14 12s10-4 14-12l-14 8-14-8Z"
                fill="#ffffff"
                opacity="0.9"
            />
            <path d="M80 122v38" stroke={palette.accent} strokeWidth="3" />

            {/* Cabello posterior (femenino) */}
            {gender === 'female' && (
                <path
                    d="M46 80c-4-32 12-48 34-48s38 16 34 48l-4 28c-2-18-6-30-12-36-8 8-30 8-38 0-6 6-10 18-12 36l-2-28Z"
                    fill={palette.hair}
                />
            )}

            {/* Cuello y rostro */}
            <rect
                x="71"
                y="98"
                width="18"
                height="20"
                rx="6"
                fill={palette.skin}
            />
            <circle cx="80" cy="74" r="31" fill={palette.skin} />
            <circle cx="49" cy="76" r="6" fill={palette.skin} />
            <circle cx="111" cy="76" r="6" fill={palette.skin} />

            {/* Cabello frontal */}
            {gender === 'female' ? (
                <path
                    d="M49 70c0-20 12-32 31-32s31 12 31 32c-8-8-18-11-31-11S57 62 49 70Z"
                    fill={palette.hair}
                />
            ) : (
                <path
                    d="M51 68c0-19 12-30 29-30s29 11 29 30c-8-7-17-10-29-10s-21 3-29 10Z"
                    fill={palette.hair}
                />
            )}

            {/* Cejas y ojos */}
            <path
                d="M64 68c4-3 9-3 12 0"
                stroke={palette.hair}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M84 68c4-3 9-3 12 0"
                stroke={palette.hair}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />
            <circle cx="70" cy="75" r="2.6" fill="#1d1d1d" />
            <circle cx="90" cy="75" r="2.6" fill="#1d1d1d" />
            <circle cx="71" cy="74" r="0.9" fill="#ffffff" />
            <circle cx="91" cy="74" r="0.9" fill="#ffffff" />

            {/* Nariz y sonrisa */}
            <path
                d="M80 78v6l3 2"
                stroke="#b07a55"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M71 90c5 5 13 5 18 0"
                stroke="#a4514d"
                strokeWidth="2.4"
                fill="none"
                strokeLinecap="round"
            />

            {/* Gafas opcionales */}
            {glasses && (
                <g stroke={palette.outfit} strokeWidth="2" fill="none">
                    <rect x="60" y="68" width="18" height="14" rx="5" />
                    <rect x="82" y="68" width="18" height="14" rx="5" />
                    <path d="M78 74h4" />
                </g>
            )}

            {/* Detalle institucional */}
            <circle cx="80" cy="138" r="4" fill={palette.accent} />
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*                     Ilustraciones decorativas de noticias                  */
/* -------------------------------------------------------------------------- */

export function NewsArt({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 400 220"
            className={cn('absolute inset-0 h-full w-full', className)}
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
        >
            <circle cx="330" cy="40" r="80" fill="#ffffff" opacity="0.1" />
            <circle cx="330" cy="40" r="52" fill="#ffffff" opacity="0.08" />
            <circle cx="60" cy="200" r="90" fill="#ffffff" opacity="0.07" />
            <path
                d="M0 170c60-24 110-24 166 0s112 24 168 0 52-16 66-12v62H0v-50Z"
                fill="#ffffff"
                opacity="0.08"
            />
            <g fill="#ffffff" opacity="0.16">
                <circle cx="60" cy="60" r="2.5" />
                <circle cx="88" cy="60" r="2.5" />
                <circle cx="116" cy="60" r="2.5" />
                <circle cx="60" cy="88" r="2.5" />
                <circle cx="88" cy="88" r="2.5" />
                <circle cx="116" cy="88" r="2.5" />
                <circle cx="60" cy="116" r="2.5" />
                <circle cx="88" cy="116" r="2.5" />
                <circle cx="116" cy="116" r="2.5" />
            </g>
            <path
                d="M300 140c22-30 52-46 90-48"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.18"
                fill="none"
            />
        </svg>
    );
}

/* -------------------------------------------------------------------------- */
/*                         Ilustraciones de graduación                        */
/* -------------------------------------------------------------------------- */

export function GraduationScene({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 600 460"
            className={cn('h-auto w-full', className)}
            role="img"
            aria-label="Ilustración de un birrete y un diploma de graduación"
        >
            <defs>
                <linearGradient id="grad-scene" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0a2540" />
                    <stop offset="100%" stopColor="#1e5fa8" />
                </linearGradient>
                <linearGradient id="grad-paper" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fffdf5" />
                    <stop offset="100%" stopColor="#f4e6b8" />
                </linearGradient>
            </defs>

            <rect width="600" height="460" rx="26" fill="url(#grad-scene)" />
            <g fill="#ffffff" opacity="0.14">
                <circle cx="72" cy="76" r="3" />
                <circle cx="118" cy="48" r="2" />
                <circle cx="510" cy="92" r="3" />
                <circle cx="548" cy="52" r="2" />
                <circle cx="464" cy="40" r="2" />
            </g>
            <circle cx="500" cy="360" r="120" fill="#c9a227" opacity="0.13" />
            <circle cx="90" cy="380" r="90" fill="#6da8e8" opacity="0.12" />

            {/* Birrete grande */}
            <g transform="translate(300 190)">
                <path
                    d="M-150 0 0-64 150 0 0 64-150 0Z"
                    fill="#0a2540"
                    stroke="#e8c15a"
                    strokeWidth="3"
                />
                <path
                    d="M-92 30v66c0 26 42 44 92 44s92-18 92-44V30L0 70-92 30Z"
                    fill="#113a63"
                />
                <path
                    d="M-92 30v66c0 26 42 44 92 44s92-18 92-44V30"
                    fill="none"
                    stroke="#e8c15a"
                    strokeWidth="2"
                    opacity="0.55"
                />
                <circle cx="0" cy="0" r="9" fill="#c9a227" />
                <path
                    d="M0 0c34 18 62 48 72 86"
                    stroke="#e8c15a"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                />
                <path d="M64 80h18v34H64z" fill="#c9a227" />
                <path d="M64 114l9 16 9-16H64Z" fill="#e8c15a" />
            </g>

            {/* Diploma */}
            <g transform="translate(300 360) rotate(-6)">
                <rect
                    x="-120"
                    y="-34"
                    width="240"
                    height="70"
                    rx="10"
                    fill="url(#grad-paper)"
                />
                <rect
                    x="-120"
                    y="-34"
                    width="240"
                    height="70"
                    rx="10"
                    fill="none"
                    stroke="#c9a227"
                    strokeWidth="3"
                />
                <circle cx="-86" cy="0" r="18" fill="#c9a227" opacity="0.9" />
                <path
                    d="M-96 0h20M-86-10v20"
                    stroke="#0a2540"
                    strokeWidth="2"
                />
                <rect
                    x="-52"
                    y="-16"
                    width="140"
                    height="8"
                    rx="4"
                    fill="#0a2540"
                    opacity="0.75"
                />
                <rect
                    x="-52"
                    y="-2"
                    width="118"
                    height="6"
                    rx="3"
                    fill="#5f6b7a"
                    opacity="0.55"
                />
                <rect
                    x="-52"
                    y="10"
                    width="96"
                    height="6"
                    rx="3"
                    fill="#5f6b7a"
                    opacity="0.45"
                />
            </g>
        </svg>
    );
}

export function GraduationCapArt({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 220 180"
            className={cn('h-auto w-full', className)}
            aria-hidden="true"
        >
            <rect width="220" height="180" rx="20" fill="#eef3fb" />
            <circle cx="172" cy="42" r="30" fill="#c9a227" opacity="0.22" />
            <g transform="translate(110 82)">
                <path d="M-70 0 0-30 70 0 0 30-70 0Z" fill="#0a2540" />
                <path
                    d="M-44 16v30c0 13 20 22 44 22s44-9 44-22V16L0 34-44 16Z"
                    fill="#113a63"
                />
                <circle cx="0" cy="0" r="5" fill="#c9a227" />
                <path
                    d="M0 0c18 10 32 26 38 46"
                    stroke="#c9a227"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
                <path d="M32 42h14v24H32z" fill="#c9a227" />
                <path d="M32 66l7 12 7-12H32Z" fill="#e8c15a" />
            </g>
        </svg>
    );
}

export function DiplomaArt({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 220 180"
            className={cn('h-auto w-full', className)}
            aria-hidden="true"
        >
            <rect width="220" height="180" rx="20" fill="#fdf4e0" />
            <circle cx="52" cy="138" r="34" fill="#c9a227" opacity="0.18" />
            <g transform="translate(110 90) rotate(-5)">
                <rect
                    x="-66"
                    y="-40"
                    width="132"
                    height="80"
                    rx="8"
                    fill="#fffdf5"
                />
                <rect
                    x="-66"
                    y="-40"
                    width="132"
                    height="80"
                    rx="8"
                    fill="none"
                    stroke="#c9a227"
                    strokeWidth="3"
                />
                <circle cx="-34" cy="0" r="16" fill="#c9a227" />
                <path d="M-42 0h16M-34-8v16" stroke="#0a2540" strokeWidth="2" />
                <rect
                    x="-8"
                    y="-18"
                    width="62"
                    height="7"
                    rx="3"
                    fill="#0a2540"
                    opacity="0.8"
                />
                <rect
                    x="-8"
                    y="-4"
                    width="52"
                    height="5"
                    rx="2.5"
                    fill="#5f6b7a"
                    opacity="0.6"
                />
                <rect
                    x="-8"
                    y="8"
                    width="42"
                    height="5"
                    rx="2.5"
                    fill="#5f6b7a"
                    opacity="0.5"
                />
            </g>
        </svg>
    );
}
