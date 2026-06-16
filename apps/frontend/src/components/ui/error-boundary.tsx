"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Import dynamique pour éviter la dépendance circulaire dans les tests
    import('@/lib/monitoring').then(({ monitoring }) => {
      monitoring.captureError(error, {
        context: this.props.section ?? 'ErrorBoundary',
        extra: { componentStack: info.componentStack ?? '' },
      });
    }).catch(() => {
      console.error('[ErrorBoundary]', error);
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {this.props.section
                ? `Erreur dans "${this.props.section}"`
                : "Une erreur est survenue"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Cette section a rencontré un problème. Vos données sont intactes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/admin/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-2 w-full max-w-lg text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Détails erreur (dev uniquement)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
                {this.state.error.message}
                {"\n"}
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

export function SectionErrorBoundary({
  children,
  section,
}: {
  children: ReactNode;
  section: string;
}) {
  return <ErrorBoundary section={section}>{children}</ErrorBoundary>;
}
