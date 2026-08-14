import type { CSSProperties } from 'react';

import { PLOT_MARGIN } from '../../../components/chartLayout.ts';

interface EquivalenceMarkerProps {
  /** Where the marker stands, in the abscissa units of the chart. */
  value: number;
  /** Lowest abscissa the chart draws. */
  from: number;
  /** Highest abscissa the chart draws. */
  to: number;
  label: string;
  /**
   * Colour of the line.
   * @default '#c22762'
   */
  color?: string;
}

/**
 * A vertical line over the chart, marking a volume worth naming.
 * @param props - Where the line stands and what to call it.
 * @returns The marker, or `null` when it falls outside the plotted range.
 */
export function EquivalenceMarker(props: EquivalenceMarkerProps) {
  const { value, from, to, label, color = '#c22762' } = props;
  const span = to - from;
  const ratio = span > 0 ? (value - from) / span : Number.NaN;
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) return null;

  const sides = PLOT_MARGIN.left + PLOT_MARGIN.right;
  const left = `calc(${PLOT_MARGIN.left}px + (100% - ${sides}px) * ${ratio})`;

  return (
    <div style={{ ...LINE_STYLE, left, borderColor: color }}>
      <span
        style={{
          ...LABEL_STYLE,
          color,
          // Keep the label inside the plot when the line is near the right edge.
          transform: ratio > 0.8 ? 'translateX(-100%)' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}

const LINE_STYLE: CSSProperties = {
  position: 'absolute',
  top: PLOT_MARGIN.top,
  bottom: PLOT_MARGIN.bottom,
  borderLeft: '2px dashed',
  pointerEvents: 'none',
};

const LABEL_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 4,
  whiteSpace: 'nowrap',
  fontSize: 11,
  fontWeight: 600,
  background: 'rgba(255, 255, 255, 0.8)',
  padding: '0 3px',
  borderRadius: 2,
};
