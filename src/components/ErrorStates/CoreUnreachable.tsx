import { Link } from 'react-router-dom';
import { Button } from '../ui';

export function CoreUnreachable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-[#EE8E28]/30 bg-[#FFE49E]/30 p-4 text-sm dark:border-[#EE8E28]/40 dark:bg-[#FFE49E]/10">
      <p className="font-semibold text-[#140D07] dark:text-white">Relict Core is unreachable</p>
      <p className="mt-1 text-[#4A3B2A] dark:text-[#E2D5C3]">
        Check the connection or try again. Existing work has been preserved.
      </p>
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        )}
        <Link
          to="/settings"
          className="inline-flex items-center px-3 font-semibold text-[#B25A12] hover:text-[#140D07] dark:text-[#FCBA48] dark:hover:text-white"
        >
          Open Settings
        </Link>
      </div>
    </div>
  );
}

export default CoreUnreachable;
