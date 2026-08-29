interface ToggleProps { label: string; checked: boolean; onChange: (checked: boolean) => void; }

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium dark:text-text-dark">
    <span>{label}</span>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-amber-deep' : 'bg-ink/20 dark:bg-white/20'}`}>
      <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </label>;
}
