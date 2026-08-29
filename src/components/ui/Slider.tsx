interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min = 1, max = 20, onChange }: SliderProps) {
  return <label className="block">
    <span className="mb-2 flex items-center justify-between text-sm font-medium dark:text-text-dark"><span>{label}</span><output className="rounded-md bg-amber-pale/60 px-2 py-0.5 text-xs font-semibold text-ink dark:bg-amber-pale/20 dark:text-amber-pale">{value}</output></span>
    <input aria-label={label} className="h-2 w-full cursor-pointer accent-amber-deep" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}
