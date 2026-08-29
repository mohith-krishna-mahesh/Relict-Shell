import { Link } from 'react-router-dom';
import { useTheme } from '@/lib/theme';

interface AppLogoProps {
  compact?: boolean;
  className?: string;
  href?: string;
}

export function AppLogo({ compact = false, className = '', href = '/workspace' }: AppLogoProps) {
  const { resolvedTheme } = useTheme();

  const logoSrc = compact
    ? '/logo/relict-logomark.svg'
    : resolvedTheme === 'dark'
      ? '/logo/relict-light.svg'
      : '/logo/relict-dark.svg';

  return (
    <Link
      to={href}
      className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      aria-label="Relict Shell"
    >
      {compact ? (
        <img
          src={logoSrc}
          alt="Relict"
          className="h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 object-contain shrink-0"
        />
      ) : (
        <img
          src={logoSrc}
          alt="Relict Shell"
          className="h-16 w-auto object-contain shrink-0 sm:h-20 md:h-24 lg:h-26 max-w-[280px] sm:max-w-[360px] md:max-w-[440px]"
        />
      )}
    </Link>
  );
}

export default AppLogo;
