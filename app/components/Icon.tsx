// Inline stroke icons from design handoff 01. Inline SVG (rather than an icon
// font or library) keeps them same-origin, offline and tinted by `currentColor`.

const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  restart: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  offline: (
    <>
      <path d="M3 3l18 18" />
      <path d="M17.5 17.5H7a4.5 4.5 0 0 1-1.2-8.84" />
      <path d="M9.6 5.6A6 6 0 0 1 18.9 10a4 4 0 0 1 1.9 6.4" />
    </>
  ),
} as const;

interface IconProps {
  name: keyof typeof PATHS;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function Icon({ name, size = 18, strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
