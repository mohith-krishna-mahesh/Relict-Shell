import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Button, Card } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import { AppLogo } from '../components/AppLogo';
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon } from '../components/Icons';
import { ErrorBanner, LoadingState } from '../components/Feedback';
import { readCoreSettings } from '../api-shapes';
import { getErrorMessage, inputClass, labelClass } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';

type SaveState = 'idle' | 'saving' | 'saved';

export function SettingsPage() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [coreUrl, setCoreUrl] = useState('');
  const [savedCoreUrl, setSavedCoreUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [coreSave, setCoreSave] = useState<SaveState>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    shellApi<unknown>('/api/settings/core')
      .then((payload) => {
        if (!active) return;
        const settings = readCoreSettings(payload);
        setCoreUrl(settings.baseUrl ?? '');
        setSavedCoreUrl(settings.baseUrl ?? '');
        setConnected(Boolean(settings.connected));
      })
      .catch((reason) => {
        if (active) setError(getErrorMessage(reason, 'Settings could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveCore = async (event: FormEvent) => {
    event.preventDefault();
    if (!apiKey) {
      setError('Enter the Core API key to update this connection.');
      return;
    }
    setCoreSave('saving');
    setError('');
    try {
      await shellApi('/api/settings/core', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: coreUrl, apiKey }),
      });
      setSavedCoreUrl(coreUrl);
      setApiKey('');
      setConnected(true);
      setCoreSave('saved');
    } catch (reason) {
      setCoreSave('idle');
      setError(getErrorMessage(reason));
    }
  };

  const testCore = async () => {
    if (coreUrl !== savedCoreUrl && !apiKey) {
      setError('Enter the API key to test a different Core URL.');
      return;
    }
    setTesting(true);
    setConnected(false);
    setError('');
    try {
      const body = apiKey ? { baseUrl: coreUrl, apiKey } : {};
      await shellApi('/api/settings/core/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setConnected(true);
    } catch (reason) {
      setError(getErrorMessage(reason, 'Core connection failed.'));
    } finally {
      setTesting(false);
    }
  };

  const displayName =
    user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? user?.username ?? 'Researcher';

  return (
    <main className="min-h-screen bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[#100C08]/95 dark:shadow-black/50">
        <div className="mx-auto flex h-24 sm:h-28 max-w-[96rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <AppLogo />
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 rounded-xl border border-[#140D07]/10 bg-white/60 px-4 py-2 text-sm font-semibold text-[#4A3B2A] transition hover:border-[#140D07]/20 hover:bg-white hover:text-[#140D07] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E2D5C3] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowLeftIcon size={17} /> Workspace
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#B25A12] dark:text-[#FCBA48]">
          Administration
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#140D07] dark:text-white sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
          Manage services and integrations connected to this Relict instance.
        </p>

        {error && (
          <div className="mt-7">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading settings…" />
        ) : (
          <div className="mt-8 space-y-6">
            <Card className="overflow-hidden p-0 dark:border-white/10 dark:bg-[#18130E]">
              <div className="flex items-start gap-4 border-b border-[#140D07]/10 p-6 dark:border-white/10">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
                  <ExternalLinkIcon size={20} />
                </span>
                <div>
                  <h2 className="font-semibold text-[#140D07] dark:text-white">Relict Core</h2>
                  <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
                    Planning, species search, and knowledge graph engine.
                  </p>
                </div>
                <span
                  className={`ml-auto hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                    connected
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-700/50'
                      : 'bg-[#140D07]/5 text-[#4A3B2A] ring-1 ring-[#140D07]/15 dark:bg-white/10 dark:text-[#E2D5C3] dark:ring-white/20'
                  }`}
                >
                  {connected && <CheckIcon size={13} />}
                  {connected ? 'Connected' : 'Not verified'}
                </span>
              </div>
              <form onSubmit={saveCore} className="space-y-5 p-6">
                <label className="block">
                  <span className={labelClass}>Core base URL</span>
                  <input
                    required
                    type="url"
                    className={inputClass}
                    value={coreUrl}
                    onChange={(event) => {
                      setCoreUrl(event.target.value);
                      setConnected(false);
                      setCoreSave('idle');
                    }}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>API key to update</span>
                  <input
                    type="password"
                    className={inputClass}
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      setCoreSave('idle');
                    }}
                    placeholder="Required when changing Core settings"
                    autoComplete="new-password"
                  />
                </label>
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="secondary" onClick={testCore} disabled={testing || !coreUrl}>
                    {testing ? 'Testing…' : 'Test connection'}
                  </Button>
                  <Button type="submit" disabled={coreSave === 'saving' || !coreUrl || !apiKey}>
                    {coreSave === 'saving' ? 'Saving…' : coreSave === 'saved' ? 'Saved' : 'Save Core settings'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="overflow-hidden p-0 dark:border-white/10 dark:bg-[#18130E]">
              <div className="flex items-center justify-between p-6">
                <div>
                  <h2 className="font-semibold text-[#140D07] dark:text-white">Session</h2>
                  <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
                    Signed in as <span className="font-medium text-[#140D07] dark:text-white">{displayName}</span>
                  </p>
                </div>
                <Button variant="secondary" onClick={() => void signOut({ redirectUrl: '/sign-in' })}>
                  Sign out
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

export default SettingsPage;
