export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  const toggle = (value: T) =>
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );

  return (
    <fieldset>
      <legend className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-[.12em] text-text-light dark:text-text-dark/80">
        {label}
      </legend>
      <div className="flex gap-1.5 rounded-2xl border border-ink/10 bg-ink/[0.04] p-1.5 dark:border-white/10 dark:bg-black/35">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-amber-deep text-white shadow-md shadow-amber-deep/20 ring-1 ring-amber-rust/30 dark:bg-amber-deep dark:text-white dark:ring-amber-rust/40'
                  : 'text-text-light hover:bg-white/70 hover:text-ink dark:text-text-dark/80 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  active
                    ? 'bg-white shadow-sm'
                    : 'bg-ink/20 dark:bg-white/20'
                }`}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SegmentedControl;
