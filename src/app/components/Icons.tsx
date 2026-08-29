import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>;
}

export const ArrowLeftIcon = (props: IconProps) => <IconBase {...props}><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></IconBase>;
export const ArrowRightIcon = (props: IconProps) => <IconBase {...props}><path d="m9 18 6-6-6-6" /></IconBase>;
export const BoltIcon = (props: IconProps) => <IconBase {...props}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></IconBase>;
export const CheckIcon = (props: IconProps) => <IconBase {...props}><path d="m5 12 4 4L19 6" /></IconBase>;
export const ChevronDownIcon = (props: IconProps) => <IconBase {...props}><path d="m6 9 6 6 6-6" /></IconBase>;
export const CloseIcon = (props: IconProps) => <IconBase {...props}><path d="M6 6l12 12M18 6 6 18" /></IconBase>;
export const DatabaseIcon = (props: IconProps) => <IconBase {...props}><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></IconBase>;
export const ExternalLinkIcon = (props: IconProps) => <IconBase {...props}><path d="M15 4h5v5M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></IconBase>;
export const GearIcon = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></IconBase>;
export const GraphIcon = (props: IconProps) => <IconBase {...props}><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="13" cy="18" r="2.5" /><path d="m8.5 6.8 7-.5M7.4 9.2l4.2 6.6M16.7 8.2l-2.5 7.4" /></IconBase>;
export const GridIcon = (props: IconProps) => <IconBase {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></IconBase>;
export const ListIcon = (props: IconProps) => <IconBase {...props}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r=".7" fill="currentColor" /><circle cx="4" cy="12" r=".7" fill="currentColor" /><circle cx="4" cy="18" r=".7" fill="currentColor" /></IconBase>;
export const MenuIcon = (props: IconProps) => <IconBase {...props}><path d="M4 7h16M4 12h16M4 17h16" /></IconBase>;
export const PlusIcon = (props: IconProps) => <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>;
export const RefreshIcon = (props: IconProps) => <IconBase {...props}><path d="M20 6v5h-5" /><path d="M18.5 15a7 7 0 1 1-.6-7.4L20 10" /></IconBase>;
export const RunIcon = (props: IconProps) => <IconBase {...props}><path d="m9 6 8 6-8 6V6Z" /></IconBase>;
export const SearchIcon = (props: IconProps) => <IconBase {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></IconBase>;
export const SparkIcon = (props: IconProps) => <IconBase {...props}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></IconBase>;
export const TargetIcon = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></IconBase>;
export const WarningIcon = (props: IconProps) => <IconBase {...props}><path d="M10.3 4.4 2.9 17.2A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.8L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></IconBase>;
export const SunIcon = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></IconBase>;
export const MoonIcon = (props: IconProps) => <IconBase {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></IconBase>;
export const UserIcon = (props: IconProps) => <IconBase {...props}><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></IconBase>;
export const TrashIcon = (props: IconProps) => <IconBase {...props}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></IconBase>;


