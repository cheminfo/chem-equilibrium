interface LogoProps {
  /**
   * Edge length of the square mark, in pixels.
   * @default 24
   */
  size?: number;
}

/**
 * The site mark: the equilibrium double harpoon, forward over reverse.
 *
 * It carries no accessible name — the wordmark next to it does — so it never
 * doubles the heading text for a screen reader.
 * @param props - The mark size.
 * @param props.size - Edge length of the square mark, in pixels.
 * @returns The logo, as an inline SVG.
 */
export function Logo({ size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      <rect width="64" height="64" rx="12" fill="var(--brand)" />
      <g
        fill="none"
        stroke="var(--brand-accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 25h34l-8-8" />
        <path d="M51 39H17l8 8" />
      </g>
    </svg>
  );
}
