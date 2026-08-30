import { AppLogo } from '@/app/components/AppLogo';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { Button, Card } from '@/components/ui';

export function MissingConfigScreen({ reason }: { reason?: string }) {
  return (
    <main className="min-h-screen bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur dark:border-white/10 dark:bg-[#100C08]/95">
        <div className="mx-auto flex h-20 sm:h-24 max-w-6xl items-center justify-between px-5 sm:px-8">
          <AppLogo />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-2xl px-5 py-12">
        <Card className="p-6 sm:p-8 dark:border-white/10 dark:bg-[#18130E] border-[#140D07]/10 bg-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EE8E28]/15 text-[#B25A12] dark:text-[#FCBA48]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B25A12] dark:text-[#FCBA48]">
                Setup Required
              </p>
              <h1 className="text-xl sm:text-2xl font-display font-medium text-[#140D07] dark:text-white">
                Authentication Configuration Missing
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#4A3B2A] dark:text-[#E2D5C3]">
            Relict Shell requires a valid <strong>Clerk Publishable Key</strong> to authenticate researchers and secure workspace projects.
            {reason && <span className="block mt-1 font-mono text-xs text-rose-600 dark:text-rose-400">Error: {reason}</span>}
          </p>

          <div className="mt-6 rounded-xl border border-[#140D07]/10 bg-[#FBF6EE] p-4 dark:border-white/10 dark:bg-[#140D07]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#140D07] dark:text-white">
              How to configure in Vercel:
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs sm:text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
              <li>
                Open your <strong>Vercel Project Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
              </li>
              <li>
                Add variable name <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/15">VITE_CLERK_PUBLISHABLE_KEY</code>.
              </li>
              <li>
                Set the value to your key from <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="font-semibold text-[#B25A12] underline dark:text-[#FCBA48]">dashboard.clerk.com</a> (starts with <code className="font-mono">pk_live_</code> or <code className="font-mono">pk_test_</code>).
              </li>
              <li>Redeploy your Vercel project.</li>
            </ol>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#140D07]/10 pt-6 dark:border-white/10">
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#4A3B2A] hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:text-white underline"
            >
              Get API Keys at Clerk &rarr;
            </a>
            <Button onClick={() => window.location.reload()}>
              Check Configuration &amp; Reload
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#140D07]/10 py-6 text-center text-xs text-[#4A3B2A] dark:border-white/10 dark:text-[#E2D5C3]">
        Relict Shell &bull; Frontier AI for Interventions &amp; Computational Biology
      </footer>
    </main>
  );
}

export default MissingConfigScreen;
