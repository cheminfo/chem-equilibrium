import { Logo } from './Logo.tsx';

interface WordmarkProps {
  /**
   * Edge length of the mark, in pixels.
   * @default 26
   */
  size?: number;
}

/**
 * The site name: the mark, then EquiLibrium.cheminfo.org with the second brand
 * colour on the half of the word that means balance.
 *
 * It renders the contents of a heading, so each call site keeps its own level.
 * @param props - The mark size.
 * @param props.size - Edge length of the mark, in pixels.
 * @returns The mark and the name.
 */
export function Wordmark({ size = 26 }: WordmarkProps) {
  return (
    <>
      <Logo size={size} />
      <span className="wordmark-text">
        <span className="wordmark-name">
          Equi<span className="wordmark-accent">Librium</span>
        </span>
        <span className="wordmark-domain">.cheminfo.org</span>
      </span>
    </>
  );
}
