import { SignIn } from '@clerk/clerk-react';
import { AppLogo } from '../components/AppLogo';

export function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-light px-4 py-12 font-sans transition-colors duration-300 dark:bg-bg-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <AppLogo href="/" />
          </div>
          <p className="text-sm text-text-light dark:text-text-dark">Sign in to access your research workspace</p>
        </div>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/workspace"
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full',
              card: 'shadow-warm rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5',
              headerTitle: 'text-ink dark:text-white font-semibold',
              headerSubtitle: 'text-text-light dark:text-text-dark',
              socialButtonsBlockButton: 'border border-black/15 dark:border-white/15 rounded-xl text-ink dark:text-white hover:bg-amber-pale/20',
              formButtonPrimary: 'bg-amber-deep hover:bg-amber-rust text-white rounded-xl font-semibold',
              formFieldInput: 'rounded-xl border-black/15 dark:border-white/15 dark:bg-white/10 dark:text-white focus:border-amber-deep focus:ring-amber-deep/30',
              formFieldLabel: 'text-text-light dark:text-text-dark text-xs font-semibold uppercase tracking-wider',
              footerActionLink: 'text-amber-deep hover:text-amber-rust font-semibold',
              identityPreview: 'rounded-xl border border-black/10 dark:border-white/10',
            },
          }}
        />
      </div>
    </main>
  );
}

export default SignInPage;
