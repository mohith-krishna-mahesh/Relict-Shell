import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import { AppLogo } from '../components/AppLogo';
import { ArrowRightIcon, GearIcon, GridIcon, ListIcon, PlusIcon, SearchIcon, TargetIcon } from '../components/Icons';
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback';
import type { Project } from '../types';
import { readProjects } from '../api-shapes';
import { formatRelativeDate, getErrorMessage, inputClass } from '../utils';
import { CreateProjectModal } from './CreateProjectModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { AppUserMenu } from '../components/AppUserMenu';

import { useUser } from '../auth/AuthGuard';

export function WorkspacePage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      setProjects(readProjects(await shellApi<unknown>('/api/projects')));
    } catch (reason) {
      setError(getErrorMessage(reason, 'Projects could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    void loadProjects();
  }, [isLoaded, user?.id]);

  const filtered = projects.filter((project) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      project.name.toLowerCase().includes(term) ||
      project.species.toLowerCase().includes(term) ||
      project.objective.toLowerCase().includes(term)
    );
  });

  const handleCreated = (project: Project) => {
    setProjects((current) => [project, ...current]);
    navigate(`/projects/${project.id}`);
  };

  return (
    <main className="min-h-screen bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[#100C08]/95 dark:shadow-black/50">
        <div className="mx-auto flex h-24 sm:h-28 max-w-[96rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <AppLogo />
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link
              to="/settings"
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#140D07]/10 bg-white/60 text-[#4A3B2A] transition hover:border-[#140D07]/20 hover:bg-white hover:text-[#140D07] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E2D5C3] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Settings"
            >
              <GearIcon size={19} />
            </Link>
            <span className="h-6 w-px bg-[#140D07]/10 dark:bg-white/10" />
            <AppUserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#B25A12] dark:text-[#FCBA48]">
              Workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#140D07] dark:text-white sm:text-4xl">
              Research projects
            </h1>
            <p className="mt-2 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
              Plan interventions and investigate biological evidence in dedicated workspaces.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon size={17} /> New project
          </Button>
        </section>

        <section className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#140D07]/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#18130E] sm:flex-row sm:items-center sm:justify-between">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Search projects</span>
            <SearchIcon
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A3B2A]/70 dark:text-[#E2D5C3]/70"
            />
            <input
              className={`${inputClass} border-transparent bg-[#140D07]/[0.035] py-2.5 pl-10 dark:bg-white/[0.06] dark:border-transparent dark:focus:border-[#EE8E28]`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
            />
          </label>
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-medium text-[#4A3B2A] dark:text-[#E2D5C3]">
              {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
            </span>
            <div className="flex rounded-xl bg-[#140D07]/5 p-1 dark:bg-white/10">
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                  view === 'grid'
                    ? 'bg-white text-[#140D07] shadow-sm dark:bg-white/20 dark:text-white'
                    : 'text-[#4A3B2A] dark:text-[#E2D5C3]'
                }`}
              >
                <GridIcon size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                  view === 'list'
                    ? 'bg-white text-[#140D07] shadow-sm dark:bg-white/20 dark:text-white'
                    : 'text-[#4A3B2A] dark:text-[#E2D5C3]'
                }`}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6">
            <ErrorBanner
              action={
                <button onClick={loadProjects} className="shrink-0 font-semibold underline">
                  Retry
                </button>
              }
            >
              {error}
            </ErrorBanner>
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading projects from database…" />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<TargetIcon />}
              title={projects.length ? 'No matching projects' : 'Create your first research project'}
              description={
                projects.length
                  ? 'Try another project name, species, or objective.'
                  : 'Define a species and target objective to begin planning evidence-backed biological strategies.'
              }
            />
          </div>
        ) : view === 'grid' ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#140D07]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#18130E]">
            {filtered.map((project, index) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={`grid gap-3 px-5 py-5 transition hover:bg-[#FFE49E]/15 dark:hover:bg-white/[0.04] sm:grid-cols-[1fr_180px_110px_24px] sm:items-center ${
                  index ? 'border-t border-[#140D07]/10 dark:border-white/10' : ''
                }`}
              >
                <div>
                  <h2 className="font-semibold text-[#140D07] dark:text-white">{project.name}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">{project.objective}</p>
                </div>
                <span className="text-sm italic text-[#4A3B2A] dark:text-[#E2D5C3]">{project.species}</span>
                <span className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">{formatRelativeDate(project.createdAt)}</span>
                <ArrowRightIcon size={17} className="text-[#4A3B2A] dark:text-[#E2D5C3]" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </main>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="group block">
      <Card className="h-full p-0 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#EE8E28]/40 group-hover:shadow-warm dark:border-white/10 dark:bg-[#18130E]">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-[#EE8E28] to-[#FFE49E]" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-lg bg-[#140D07]/5 px-2.5 py-1 text-xs font-medium italic text-[#4A3B2A] dark:bg-white/10 dark:text-[#E2D5C3]">
              {project.species}
            </span>
            <ArrowRightIcon
              size={18}
              className="mt-1 text-[#4A3B2A] transition group-hover:translate-x-1 group-hover:text-[#B25A12] dark:text-[#E2D5C3] dark:group-hover:text-[#FCBA48]"
            />
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight text-[#140D07] dark:text-white">{project.name}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#4A3B2A] dark:text-[#E2D5C3]">
            {project.objective}
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-[#140D07]/10 pt-4 text-xs text-[#4A3B2A] dark:border-white/10 dark:text-[#E2D5C3]">
            <span>{project._count?.runs ?? 0} runs</span>
            <span>Created {formatRelativeDate(project.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default WorkspacePage;
