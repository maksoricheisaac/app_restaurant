'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string; // Nom de la section pour contextualiser l'erreur
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En production : envoyer à Sentry ici
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">
              {this.props.section
                ? `Erreur dans "${this.props.section}"`
                : 'Une erreur inattendue est survenue'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cette section a rencontré un problème. Vos données sont intactes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/admin/dashboard')}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-2 w-full max-w-lg text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Détails (dev uniquement)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper léger pour les sections individuelles (grilles, listes, formulaires)
 */
export function SectionErrorBoundary({
  children,
  section,
}: {
  children: ReactNode;
  section: string;
}) {
  return <ErrorBoundary section={section}>{children}</ErrorBoundary>;
}
