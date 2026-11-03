import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type Props = {
    children: ReactNode;
};

type State = {
    hasError: boolean;
};

/**
 * Error boundary de la landing. Evita que un fallo en una sección
 * deje toda la página en blanco.
 */
export class LandingErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Error en la landing de la UPEL', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-upel-gold/15 text-upel-navy">
                        <AlertTriangle className="size-6" aria-hidden="true" />
                    </span>
                    <h2 className="font-display mt-5 text-2xl font-bold text-upel-navy">
                        No pudimos cargar esta sección
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-upel-slate">
                        Ocurrió un error inesperado. Recarga la página para volver a
                        intentarlo.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-6 inline-flex items-center gap-2 rounded-[13px] bg-upel-navy px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-upel-navy-800"
                    >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Recargar página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
