import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { AppLogo } from "../components/AppLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { ExternalLinkIcon, UserIcon } from "../components/Icons";

function AnonymousUserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#140D07]/15 bg-white text-[#4A3B2A] transition hover:border-[#EE8E28]/40 hover:bg-[#FFE49E]/20 hover:text-[#140D07] dark:border-white/15 dark:bg-white/5 dark:text-[#E2D5C3] dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-[#140D07]/10 bg-white p-1.5 shadow-warm backdrop-blur dark:border-white/10 dark:bg-[#18130E] dark:shadow-2xl z-50">
          <Link
            to="/sign-in"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3.5 py-2 text-sm font-medium text-[#140D07] transition hover:bg-[#FFE49E]/25 dark:text-white dark:hover:bg-white/10"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-xl px-3.5 py-2 text-sm font-medium text-[#140D07] transition hover:bg-[#FFE49E]/25 dark:text-white dark:hover:bg-white/10"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}

export function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF6EE] font-sans text-[#140D07] transition-colors duration-200 dark:bg-[#100C08] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-[#140D07]/10 bg-[#FBF6EE]/95 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[#100C08]/95 dark:shadow-black/50">
        <div className="mx-auto flex h-24 sm:h-28 max-w-[96rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <AppLogo href="/" />
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <span className="h-6 w-px bg-[#140D07]/10 dark:bg-white/10" />
            <AnonymousUserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <img
              src="/logo/relict-logomark.svg"
              alt="Relict Shell"
              className="h-28 w-28 sm:h-36 sm:w-36 object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#140D07] dark:text-white">
            Relict Shell
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-7 text-[#4A3B2A] dark:text-[#E2D5C3] max-w-md mx-auto">
            The research workspace for Relict.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/sign-in" className="w-full sm:w-auto">
              <Button className="w-full sm:min-w-[140px] py-3 text-base">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:min-w-[140px] py-3 text-base">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Secondary External Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-[#140D07]/5 dark:border-white/5">
            <a
              href="https://relict.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#140D07]/10 bg-white/50 px-4 py-2 text-xs font-semibold text-[#4A3B2A] transition hover:border-[#140D07]/20 hover:bg-white hover:text-[#140D07] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E2D5C3] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Main Website <ExternalLinkIcon size={13} />
            </a>
            <a
              href="https://github.com/relictbio/relict-core"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#140D07]/10 bg-white/50 px-4 py-2 text-xs font-semibold text-[#4A3B2A] transition hover:border-[#140D07]/20 hover:bg-white hover:text-[#140D07] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E2D5C3] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Relict Core <ExternalLinkIcon size={13} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EntryPage;
