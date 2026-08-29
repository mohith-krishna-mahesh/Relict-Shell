import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[#140D07]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#18130E] dark:shadow-none ${className}`}
      {...props}
    />
  );
}

export default Card;
