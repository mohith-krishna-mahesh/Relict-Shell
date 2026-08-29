import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { shellApi } from '@/lib/core-client';
import { AppLogo } from '../components/AppLogo';
import { ErrorBanner, LoadingState } from '../components/Feedback';
import {
  ArrowLeftIcon,
  CloseIcon,
  GearIcon,
  GraphIcon,
  MenuIcon,
  RunIcon,
  SparkIcon,
  TargetIcon,
} from '../components/Icons';
import type { Project } from '../types';
import { readProjectResponse } from '../api-shapes';
import { getErrorMessage } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { AppUserMenu } from '../components/AppUserMenu';

export interface ProjectOutletContext {
  project: Project;
}
export function useProject() {
  return useOutletContext<ProjectOutletContext>().project;
}

const navItems = [
  { label: 'Overview', path: '', icon: TargetIcon, end: true },
  { label: 'Planner', path: 'planner', icon: SparkIcon },
  { label: 'Knowledge graph', path: 'knowledge-graph', icon: GraphIcon },
  { label: 'Runs', path: 'runs', icon: RunIcon },
];

export function ProjectLayout() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setError('Project ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    shellApi<unknown>(`/api/projects/${projectId}`)
      .then((value) => {
        if (!active) return;
        const next = readProjectResponse(value);
        if (!next) throw new Error('Project response was invalid.');
        setProject(next);
      })
      .catch((reason) => {
        if (active) setError(getErrorMessage(reason, 'Project could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-light transition-colors duration-200 dark:bg-bg-dark">
        <LoadingState label="Loading project workspace…" />
      </main>
    );
  }

  if (!project || error) {
    return (
      <main className="min-h-screen bg-bg-light p-6 transition-colors duration-200 dark:bg-bg-dark">
        <div className="mx-auto max-w-xl pt-20">
          <ErrorBanner>{error || 'Project not found.'}</ErrorBanner>
          <Link
            to="/workspace"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-rust hover:text-ink dark:text-amber dark:hover:text-white"
          >
            <ArrowLeftIcon size={16} /> Return to workspace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white">
      {/* Persistent Global Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[#100C08]/95 dark:shadow-black/50">
        <div className="mx-auto flex h-24 sm:h-28 max-w-[96rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <AppLogo />
            <div className="hidden md:flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[#4A3B2A] dark:text-[#E2D5C3]">
              <span>/</span>
              <Link
                to="/workspace"
                className="transition hover:text-[#B25A12] dark:hover:text-[#FCBA48]"
              >
                Projects
              </Link>
              <span>/</span>
              <span className="max-w-[220px] truncate text-[#140D07] dark:text-white normal-case font-medium">
                {project.name}
              </span>
            </div>
          </div>

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
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#140D07]/10 bg-white/60 text-[#140D07] transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
              aria-label="Open project navigation"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body with Sidebar & Content */}
      <div className="flex-1 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] max-w-[96rem] w-full mx-auto">
        {/* Mobile Backdrop */}
        {menuOpen && (
          <button
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation overlay"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#140D07]/10 bg-[#F7F2E9] text-[#140D07] shadow-2xl transition-transform lg:static lg:z-auto lg:h-auto lg:w-auto lg:translate-x-0 dark:border-white/10 dark:bg-[#140D07] dark:text-white ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex h-20 items-center justify-between border-b border-[#140D07]/10 px-5 dark:border-white/10 lg:hidden">
            <AppLogo />
            <button
              onClick={() => setMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#4A3B2A] hover:bg-[#140D07]/5 dark:text-[#E2D5C3] dark:hover:bg-white/10"
              aria-label="Close navigation"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="px-5 py-6">
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#4A3B2A] transition hover:bg-[#140D07]/5 hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowLeftIcon size={15} /> All projects
            </Link>
            <div className="mt-4 rounded-2xl border border-[#140D07]/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1C1610]">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-[#B25A12] dark:text-[#FCBA48]">
                Active Project
              </p>
              <p className="mt-1 font-display text-base font-semibold text-[#140D07] dark:text-white leading-snug">
                {project.name}
              </p>
              <p className="mt-1.5 break-words font-display text-xs italic leading-relaxed text-[#4A3B2A] dark:text-[#FFE49E]">
                {project.species}
              </p>
            </div>
          </div>

          <nav className="space-y-2 px-4">
            {navItems.map(({ label, path, icon: Icon, end }) => (
              <NavLink
                key={label}
                to={path}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#EE8E28] text-white shadow-md shadow-[#EE8E28]/25 ring-1 ring-[#EE8E28] dark:bg-[#EE8E28] dark:text-white dark:shadow-[#EE8E28]/30 dark:ring-[#EE8E28]'
                      : 'font-medium text-[#4A3B2A] hover:bg-[#140D07]/5 hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:bg-white/[0.08] dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={
                        isActive
                          ? 'text-white'
                          : 'text-[#4A3B2A]/70 transition group-hover:text-[#140D07] dark:text-[#E2D5C3]/70 dark:group-hover:text-white'
                      }
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          <Outlet context={{ project } satisfies ProjectOutletContext} />
        </div>
      </div>
    </div>
  );
}

export default ProjectLayout;
