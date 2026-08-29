import { Link } from 'react-router-dom';

export function InvalidApiKey() {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm dark:border-red-500/40 dark:bg-red-950/40">
      <p className="font-semibold text-red-600 dark:text-red-400">Core rejected the API key</p>
      <p className="mt-1 text-[#4A3B2A] dark:text-[#E2D5C3]">Update the saved credentials, then retry this request.</p>
      <Link
        to="/settings"
        className="mt-3 inline-flex font-semibold text-[#B25A12] hover:text-[#140D07] dark:text-[#FCBA48] dark:hover:text-white"
      >
        Open Settings
      </Link>
    </div>
  );
}

export default InvalidApiKey;
