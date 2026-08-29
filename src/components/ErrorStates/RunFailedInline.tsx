export function RunFailedInline({
  message = 'The live run stopped before completion. Partial graph results remain available.',
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-[#FBF6EE]/95 p-4 text-sm shadow-md dark:border-red-500/40 dark:bg-[#18130E]/95"
    >
      <p className="font-semibold text-red-600 dark:text-red-400">Run stream interrupted</p>
      <p className="mt-1 text-[#4A3B2A] dark:text-[#E2D5C3]">{message}</p>
    </div>
  );
}

export default RunFailedInline;
