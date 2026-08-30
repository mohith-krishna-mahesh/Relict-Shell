import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppLogo } from '@/app/components/AppLogo';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { Button, Card } from '@/components/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public override render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected client error occurred.';
      const isClerkKeyError =
        errorMessage.toLowerCase().includes('publishablekey') ||
        errorMessage.toLowerCase().includes('clerk');

      return (
        <main className="min-h-screen bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white flex flex-col justify-between">
          <header className="border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur dark:border-white/10 dark:bg-[#100C08]/95">
            <div className="mx-auto flex h-20 sm:h-24 max-w-6xl items-center justify-between px-5 sm:px-8">
              <AppLogo />
              <ThemeToggle />
            </div>
          </header>

          <div className="mx-auto w-full max-w-2xl px-5 py-12">
            <Card className="p-6 sm:p-8 dark:border-white/10 dark:bg-[#18130E] border-[#140D07]/10 bg-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Application Error
                  </p>
                  <h1 className="text-xl sm:text-2xl font-display font-medium text-[#140D07] dark:text-white">
                    {isClerkKeyError ? 'Authentication Initialization Failed' : 'Something went wrong'}
                  </h1>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#4A3B2A] dark:text-[#E2D5C3]">
                {isClerkKeyError
                  ? 'Relict Shell could not initialize authentication. Please verify that your VITE_CLERK_PUBLISHABLE_KEY is configured correctly.'
                  : 'An unhandled exception occurred while rendering the workspace interface.'}
              </p>

              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-50/50 p-4 font-mono text-xs text-rose-900 dark:bg-rose-950/20 dark:text-rose-300 overflow-x-auto">
                {errorMessage}
              </div>

              {this.state.errorInfo?.componentStack && (
                <details className="mt-4 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                  <summary className="cursor-pointer font-medium hover:underline">
                    View component stack
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-black/5 p-3 dark:bg-white/5 font-mono text-[11px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#140D07]/10 pt-6 dark:border-white/10">
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="text-xs font-semibold text-[#B25A12] hover:text-[#140D07] dark:text-[#FCBA48] dark:hover:text-white underline"
                >
                  &larr; Return to Home
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      this.setState({ hasError: false, error: null, errorInfo: null });
                    }}
                  >
                    Try Again
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Reload Application
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <footer className="border-t border-[#140D07]/10 py-6 text-center text-xs text-[#4A3B2A] dark:border-white/10 dark:text-[#E2D5C3]">
            Relict Shell &bull; Frontier AI for Interventions &amp; Computational Biology
          </footer>
        </main>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
