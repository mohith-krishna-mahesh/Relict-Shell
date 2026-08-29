import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-[#140D07] text-[#FBF6EE] shadow-sm hover:bg-[#B25A12] disabled:bg-[#140D07]/35 dark:bg-[#EE8E28] dark:text-white dark:hover:bg-[#B25A12] dark:shadow-md dark:shadow-[#EE8E28]/20 dark:disabled:bg-[#EE8E28]/40',
  secondary:
    'border border-[#140D07]/15 bg-white text-[#140D07] shadow-sm hover:border-[#EE8E28] hover:bg-[#FFE49E]/20 disabled:opacity-45 dark:border-white/15 dark:bg-[#1C1610] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10',
  ghost:
    'text-[#4A3B2A] hover:bg-[#140D07]/5 hover:text-[#140D07] disabled:opacity-40 dark:text-[#E2D5C3] dark:hover:bg-white/10 dark:hover:text-white',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
