import { useTheme } from '@/lib/theme';
import { MoonIcon, SunIcon } from './Icons';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-ink shadow-sm backdrop-blur transition hover:border-black/25 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/15 ${className}`}
    >
      {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
    </button>
  );
}
