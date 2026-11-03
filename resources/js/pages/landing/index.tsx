import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { About } from '@/components/landing/about';
import { Careers } from '@/components/landing/careers';
import { Courses } from '@/components/landing/courses';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { Graduations } from '@/components/landing/graduations';
import { HeroSlider } from '@/components/landing/hero-slider';
import { LandingErrorBoundary } from '@/components/landing/landing-error-boundary';
import { Navbar } from '@/components/landing/navbar';
import { News } from '@/components/landing/news';
import { OnlineMode } from '@/components/landing/online-mode';
import { StatsBand } from '@/components/landing/stats-band';
import { Teachers } from '@/components/landing/teachers';

type LandingProps = {
    canRegister: boolean;
    canEnroll: boolean;
    preEnrollmentOpensAt: string;
    enrollmentOpensAt: string;
    graduationDate: string;
};

/**
 * Landing pública de la Universidad Pedagógica Experimental Libertador.
 * Composición de secciones + navegación al login.
 */
export default function LandingIndex({
    canRegister,
    preEnrollmentOpensAt,
    graduationDate,
}: LandingProps) {
    const navigate = (url: string) => router.visit(url);

    return (
        <>
            <Head title="Educación que transforma">
                <meta
                    name="description"
                    content="Universidad Pedagógica Experimental Libertador (UPEL): carreras de pregrado, formación online, cursos certificados y postgrados para educadores en Venezuela."
                />
                <meta name="theme-color" content="#0a2540" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="UPEL" />
                <meta property="og:title" content="UPEL | Educación que transforma" />
                <meta
                    property="og:description"
                    content="Más de 40 años formando a los educadores de Venezuela. Explora carreras, cursos y programas 100% online."
                />
                <meta property="og:locale" content="es_VE" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="UPEL | Educación que transforma" />
                <meta
                    name="twitter:description"
                    content="Carreras, cursos y formación online de la Universidad Pedagógica Experimental Libertador."
                />
            </Head>

            <div className="landing-page min-h-screen">
                <a href="#contenido" className="skip-link">
                    Saltar al contenido principal
                </a>

                <Navbar
                    onLoginClick={() => router.visit('/login')}
                    canRegister={canRegister}
                    registrationOpensAt={preEnrollmentOpensAt}
                />

                <LandingErrorBoundary>
                    <main id="contenido">
                        <HeroSlider
                            canRegister={canRegister}
                            preEnrollmentOpensAt={preEnrollmentOpensAt}
                            onLoginClick={() => navigate('/login')}
                        />
                        <StatsBand />
                        <About />
                        <Careers />
                        <OnlineMode />
                        <Courses />
                        <Teachers />
                        <News />
                        <Graduations graduationDate={graduationDate} />
                        <CTA
                            canRegister={canRegister}
                            registrationOpensAt={preEnrollmentOpensAt}
                            onLoginClick={() => navigate('/login')}
                        />
                    </main>

                    <Footer onLoginClick={() => navigate('/login')} />
                </LandingErrorBoundary>
            </div>
        </>
    );
}