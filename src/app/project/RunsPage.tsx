import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback';
import { ArrowRightIcon, RefreshIcon, RunIcon, SparkIcon } from '../components/Icons';
import type { RunRecord } from '../types';
import { readRuns } from '../api-shapes';
import { formatDate, formatRelativeDate, getErrorMessage, statusTone } from '../utils';
import { useProject } from './ProjectLayout';

export function RunsPage() {
  const project = useProject();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRuns(readRuns(await shellApi<unknown>(`/api/projects/${project.id}/runs`)));
    } catch (reason) {
      setError(getErrorMessage(reason, 'Runs could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#B25A12] dark:text-[#FCBA48]">
              Run history
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#140D07] dark:text-white sm:text-4xl">
              Research runs
            </h1>
            <p className="mt-2 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
              Review every investigation launched for this project.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadRuns} disabled={loading}>
              <RefreshIcon size={16} /> Refresh
            </Button>
            <Link to="../planner">
              <Button>
                <SparkIcon size={16} /> New run
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner
              action={
                <button onClick={loadRuns} className="font-semibold underline">
                  Retry
                </button>
              }
            >
              {error}
            </ErrorBanner>
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading run history…" />
        ) : runs.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<RunIcon />}
              title="No research runs yet"
              description="Use the planner to start an evidence-backed investigation for this project."
              action={
                <Link to="../planner">
                  <Button>Plan first run</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#140D07]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#18130E]">
            <div className="hidden grid-cols-[140px_1fr_150px_120px_30px] gap-4 border-b border-[#140D07]/10 bg-[#140D07]/[0.025] px-5 py-3.5 text-xs font-semibold uppercase tracking-[.1em] text-[#4A3B2A] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E2D5C3] md:grid">
              <span>Status</span>
              <span>Objective</span>
              <span>Started</span>
              <span>Run ID</span>
              <span />
            </div>
            {runs.map((run) => (
              <Link
                key={run.id}
                to={`../knowledge-graph?run=${encodeURIComponent(run.coreRunId || run.id)}`}
                className="grid gap-3 border-b border-[#140D07]/10 px-5 py-5 transition last:border-0 hover:bg-[#FFE49E]/15 dark:border-white/10 dark:hover:bg-white/[0.04] md:grid-cols-[140px_1fr_150px_120px_30px] md:items-center md:gap-4"
              >
                <span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(
                      run.status
                    )}`}
                  >
                    {run.status}
                  </span>
                </span>
                <span>
                  <span className="line-clamp-2 text-sm font-medium leading-5 text-[#140D07] dark:text-white">
                    {run.objective}
                  </span>
                  <span className="mt-1 block text-xs text-[#4A3B2A] dark:text-[#E2D5C3] md:hidden">
                    {formatDate(run.createdAt)}
                  </span>
                </span>
                <span
                  className="hidden text-xs text-[#4A3B2A] dark:text-[#E2D5C3] md:block"
                  title={formatDate(run.createdAt)}
                >
                  {formatRelativeDate(run.createdAt)}
                </span>
                <span
                  className="hidden truncate font-mono text-xs text-[#4A3B2A] dark:text-[#E2D5C3] md:block"
                  title={run.coreRunId}
                >
                  {run.coreRunId ? run.coreRunId.slice(0, 10) : run.id.slice(0, 8)}
                </span>
                <ArrowRightIcon size={17} className="hidden text-[#4A3B2A] dark:text-[#E2D5C3] md:block" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default RunsPage;
