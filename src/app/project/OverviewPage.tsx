import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import {
  ArrowRightIcon,
  CloseIcon,
  GraphIcon,
  RunIcon,
  SparkIcon,
  TargetIcon,
  TrashIcon,
} from '../components/Icons';
import { ErrorBanner } from '../components/Feedback';
import type { RunRecord } from '../types';
import { readLatestRun } from '../api-shapes';
import {
  formatDate,
  formatRelativeDate,
  getErrorMessage,
  inputClass,
  labelClass,
  statusTone,
} from '../utils';
import { useProject } from './ProjectLayout';

export function OverviewPage() {
  const project = useProject();
  const navigate = useNavigate();
  const [latestRun, setLatestRun] = useState<RunRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let active = true;
    shellApi<unknown>(`/api/projects/${project.id}/runs/latest`)
      .then((payload) => {
        if (active) setLatestRun(readLatestRun(payload));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [project.id]);

  const isConfirmed =
    confirmInput.trim().toLowerCase() === project.name.trim().toLowerCase() ||
    confirmInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await shellApi(`/api/projects/${project.id}`, { method: 'DELETE' });
      navigate('/workspace', { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete project. Please try again.'));
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-[#140D07]/10 bg-[#FFE49E]/20 px-5 py-12 dark:border-white/10 dark:bg-white/[0.02] sm:px-8 lg:px-12 lg:py-16">
        <div className="absolute -right-28 -top-36 h-96 w-96 rounded-full border-[60px] border-[#FCBA48]/10 dark:border-[#FCBA48]/5" />
        <div className="relative max-w-5xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-[.16em] text-[#B25A12] dark:text-[#FCBA48]">
            Project overview
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight text-[#140D07] dark:text-white sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-5 max-w-3xl font-display text-lg leading-8 text-[#4A3B2A] dark:text-[#E2D5C3] sm:text-xl">
            {project.objective}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-sans">
            <Link to="planner">
              <Button>
                <SparkIcon size={17} /> Plan a run
              </Button>
            </Link>
            <Link to="knowledge-graph">
              <Button variant="secondary">
                <GraphIcon size={17} /> Explore graph
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
        <div className="grid max-w-6xl gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SpeciesContextCard species={project.species} />
          <ContextCard label="Scope" value={project.scope} icon={<TargetIcon size={20} />} />
          <ContextCard
            label="Runs"
            value={String(project._count?.runs ?? (latestRun ? 1 : 0))}
            icon={<RunIcon size={20} />}
          />
          <ContextCard
            label="Created"
            value={formatDate(project.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
            icon={<span className="text-lg">⌁</span>}
          />
        </div>

        <div className="mt-10 grid max-w-6xl gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <Card className="p-0 dark:border-white/10 dark:bg-[#18130E]">
            <div className="flex items-center justify-between border-b border-[#140D07]/10 px-6 py-5 dark:border-white/10">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[.13em] text-[#4A3B2A] dark:text-[#E2D5C3]">
                  Current activity
                </p>
                <h2 className="mt-1 font-display text-xl font-medium text-[#140D07] dark:text-white">
                  Latest research run
                </h2>
              </div>
              {latestRun && (
                <Link
                  to="runs"
                  className="font-sans text-xs font-semibold text-[#B25A12] hover:underline dark:text-[#FCBA48]"
                >
                  All runs
                </Link>
              )}
            </div>
            {latestRun ? (
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="max-w-xl font-display text-lg leading-7 text-[#140D07] dark:text-white">
                    {latestRun.objective}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 font-sans text-xs font-semibold capitalize ${statusTone(
                      latestRun.status
                    )}`}
                  >
                    {latestRun.status}
                  </span>
                </div>
                <p className="mt-4 font-sans text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                  Started {formatRelativeDate(latestRun.createdAt)}
                </p>
                <Link
                  to={`knowledge-graph?run=${encodeURIComponent(latestRun.coreRunId || latestRun.id)}`}
                  className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#B25A12] hover:text-[#140D07] dark:text-[#FCBA48] dark:hover:text-white"
                >
                  Open result <ArrowRightIcon size={16} />
                </Link>
              </div>
            ) : (
              <div className="p-8 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
                  <SparkIcon />
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-[#140D07] dark:text-white">No runs yet</h3>
                <p className="mx-auto mt-2 max-w-sm font-sans text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">
                  Start with the planner to identify candidate genes and generate evidence-backed strategies.
                </p>
                <Link to="planner" className="mt-5 inline-flex">
                  <Button>Open planner</Button>
                </Link>
              </div>
            )}
          </Card>
          <div className="rounded-2xl border border-[#140D07]/10 bg-[#16110C] p-6 text-white shadow-sm dark:border-white/10 dark:bg-[#16110C]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FCBA48]/20 text-[#FCBA48]">
              <GraphIcon />
            </span>
            <h2 className="mt-6 font-display text-2xl font-medium text-white">Follow the evidence</h2>
            <p className="mt-3 font-sans text-sm leading-6 text-[#E2D5C3]">
              Inspect biological relationships as Core streams them into the graph. Filter and highlight
              candidate genes locally.
            </p>
            <Link
              to="knowledge-graph"
              className="mt-7 inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#FCBA48] hover:text-[#FFE49E] transition"
            >
              Open knowledge graph <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* Danger Zone: Permanent Project Deletion */}
        <div className="mt-12 max-w-6xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 dark:border-red-500/30 dark:bg-red-950/[0.15]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-sans text-base font-semibold text-red-900 dark:text-red-300">
                  Danger Zone
                </h3>
                <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
                  Permanently delete this project, all research runs, and generated knowledge graph data. This
                  action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmInput('');
                  setDeleteError('');
                  setDeleteModalOpen(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-white px-4 py-2.5 font-sans text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-500/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/40 dark:hover:bg-red-900/60"
              >
                <TrashIcon size={16} /> Delete project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Irreversible Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#140D07]/60 p-4 backdrop-blur-sm dark:bg-black/80"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#FBF6EE] p-6 shadow-2xl dark:border-red-500/40 dark:bg-[#18130E] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <TrashIcon size={20} />
                </span>
                <h3
                  id="delete-project-title"
                  className="font-display text-xl font-semibold text-[#140D07] dark:text-white"
                >
                  Delete project permanently
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-[#4A3B2A] hover:bg-[#140D07]/5 dark:text-[#E2D5C3] dark:hover:bg-white/10"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">
              This action is{' '}
              <strong className="text-red-600 dark:text-red-400">permanent and irreversible</strong>. There is
              no undo functionality. All research runs, candidate gene configurations, and knowledge graph
              history for &ldquo;
              <span className="font-semibold text-[#140D07] dark:text-white">{project.name}</span>&rdquo; will be
              deleted forever.
            </p>

            {deleteError && (
              <div className="mt-4">
                <ErrorBanner>{deleteError}</ErrorBanner>
              </div>
            )}

            <div className="mt-5">
              <label className="block">
                <span className={labelClass}>
                  Type <strong className="text-[#140D07] dark:text-white">{project.name}</strong> or{' '}
                  <strong className="text-red-600 dark:text-red-400">DELETE</strong> to confirm:
                </span>
                <input
                  type="text"
                  autoFocus
                  disabled={deleting}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={project.name}
                  className={`${inputClass} border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/40`}
                />
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3 border-t border-[#140D07]/10 pt-5 dark:border-white/10">
              <Button
                variant="ghost"
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={!isConfirmed || deleting}
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? 'Deleting project…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SpeciesContextCard({ species }: { species: string }) {
  const speciesList = species.split(',').map((s) => s.trim()).filter(Boolean);
  return (
    <Card className="flex items-start gap-4 dark:border-white/10 dark:bg-[#18130E]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFE49E]/75 font-sans text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
        <span className="text-xl">◌</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-xs font-semibold uppercase tracking-[.12em] text-[#4A3B2A] dark:text-[#E2D5C3]">
          {speciesList.length > 1 ? 'Selected Species' : 'Species'}
        </p>
        <div className="mt-1 space-y-1">
          {speciesList.map((name) => (
            <p
              key={name}
              className="break-words font-display text-base font-medium italic leading-snug text-[#140D07] dark:text-white sm:text-lg"
            >
              {name}
            </p>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ContextCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card className="flex items-start gap-4 dark:border-white/10 dark:bg-[#18130E]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFE49E]/75 font-sans text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-xs font-semibold uppercase tracking-[.12em] text-[#4A3B2A] dark:text-[#E2D5C3]">
          {label}
        </p>
        <p
          className="mt-1 break-words font-display text-lg font-medium leading-snug text-[#140D07] dark:text-white"
          title={value}
        >
          {value}
        </p>
      </div>
    </Card>
  );
}

export default OverviewPage;
