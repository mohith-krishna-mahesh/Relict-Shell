import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import { AppLogo } from '../components/AppLogo';
import { CheckIcon, DatabaseIcon, ExternalLinkIcon } from '../components/Icons';
import { ErrorBanner } from '../components/Feedback';
import { readCoreSettings } from '../api-shapes';
import { getErrorMessage, inputClass, labelClass } from '../utils';

export function ConnectCorePage() {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tested, setTested] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    shellApi<unknown>('/api/settings/core')
      .then((payload) => {
        if (!active) return;
        const settings = readCoreSettings(payload);
        if (settings.baseUrl) setBaseUrl(settings.baseUrl);
        setTested(Boolean(settings.connected));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setError('');
    setTested(false);
    try {
      await shellApi('/api/settings/core/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey }),
      });
      setTested(true);
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not reach Core at this address.'));
    } finally {
      setTesting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await shellApi('/api/settings/core', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey }),
      });
      navigate('/workspace', { replace: true });
    } catch (reason) {
      setError(getErrorMessage(reason, 'Core settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF6EE] px-5 py-8 font-sans text-[#140D07] transition-colors duration-200 sm:px-8 dark:bg-[#100C08] dark:text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <AppLogo />
        <span className="rounded-full bg-[#140D07]/5 px-3 py-1.5 text-xs font-semibold text-[#4A3B2A] dark:bg-white/10 dark:text-[#E2D5C3]">
          Step 1 of 1
        </span>
      </header>
      <div className="mx-auto grid max-w-5xl items-start gap-10 py-16 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
        <section className="pt-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
            <DatabaseIcon size={24} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-[#140D07] dark:text-white">
            Connect Relict Core
          </h1>
          <p className="mt-4 text-base leading-7 text-[#4A3B2A] dark:text-[#E2D5C3]">
            Core performs species search, planning, and graph generation. Your Shell instance stores this connection securely.
          </p>
          <ol className="mt-8 space-y-5">
            {[
              'Enter the URL for your Core deployment.',
              'Test the connection and verify its health.',
              'Save once the connection succeeds.',
            ].map((text, index) => (
              <li key={text} className="flex gap-3 text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#140D07]/15 bg-white text-xs font-bold text-[#140D07] dark:border-white/15 dark:bg-white/10 dark:text-white">
                  {index + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
          <a
            href="https://github.com/relictbio/relict-core"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B25A12] hover:text-[#140D07] dark:text-[#FCBA48] dark:hover:text-white"
          >
            Core deployment guide <ExternalLinkIcon size={15} />
          </a>
        </section>

        <Card className="p-6 shadow-warm sm:p-8 dark:border-white/10 dark:bg-[#18130E]">
          <form onSubmit={submit}>
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-[#140D07] dark:text-white">Connection details</h2>
              <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">Use a reachable HTTPS URL in production.</p>
            </div>
            {error && (
              <div className="mb-5">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            )}
            <label className="block">
              <span className={labelClass}>Core base URL</span>
              <input
                required
                type="url"
                className={inputClass}
                value={baseUrl}
                onChange={(event) => {
                  setBaseUrl(event.target.value);
                  setTested(false);
                }}
                placeholder="https://core.example.org"
                disabled={loading}
              />
            </label>
            <label className="mt-5 block">
              <span className={labelClass}>API key</span>
              <input
                required
                type="password"
                className={inputClass}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setTested(false);
                }}
                placeholder="••••••••••••"
                autoComplete="off"
                disabled={loading}
              />
            </label>
            <div
              className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                tested
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-[#140D07]/10 bg-[#140D07]/[0.025] text-[#4A3B2A] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E2D5C3]'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  tested ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-[#140D07]/5 dark:bg-white/10'
                }`}
              >
                {tested ? <CheckIcon size={14} /> : <span className="h-2 w-2 rounded-full bg-[#140D07]/25 dark:bg-white/40" />}
              </span>
              {tested ? 'Connection verified. Core is ready.' : 'Test the connection before continuing.'}
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={testConnection} disabled={!baseUrl || !apiKey || testing || saving}>
                {testing ? 'Testing…' : 'Test connection'}
              </Button>
              <Button type="submit" disabled={!baseUrl || !apiKey || saving || testing}>
                {saving ? 'Saving…' : 'Save and continue'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default ConnectCorePage;
