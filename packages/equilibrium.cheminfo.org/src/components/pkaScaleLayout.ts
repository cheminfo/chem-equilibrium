import type { StrengthBand } from '../chemistry/species.ts';

/** Geometry of the pKa scale, in the units of its `viewBox`. */
export const WIDTH = 320;
export const HEIGHT = 472;
export const TICK_LABEL_X = 92;
export const BAND_X = 108;
export const BAND_WIDTH = 44;
export const BAND_MIDDLE = BAND_X + BAND_WIDTH / 2;
export const LABEL_X = 158;
export const TOP = 30;

export const INK = '#1c2127';
export const DIM = '#5f6b7c';
/** Colour of the marker showing where the selected couple sits. */
export const MARK = '#c22762';

export const TICKS = [-10, -5, 0, 5, 10, 15, 20, 25];

/** The two ends of the water levelling window. */
export const LEVELLING = [
  { pK: -1.74, label: 'H3O+', text: 'pKa −1.74' },
  { pK: 15.74, label: 'H2O', text: 'pKa 15.74' },
];

/** One strength band, as it is laid out on the scale. */
export interface ScaleBand {
  band: StrengthBand;
  from: number;
  to: number;
  /** Its label, already split into the lines it is drawn on. */
  lines: string[];
  /**
   * Draw a line from the band to its label, for a band too thin to reach it.
   * @default false
   */
  leader?: boolean;
}

export const BANDS: ScaleBand[] = [
  { band: 'strong-acid', from: -10, to: -1.6, lines: ['Strong acid'] },
  { band: 'weak-acid', from: -1.6, to: 6.9, lines: ['Weak acid'] },
  { band: 'neutral', from: 6.9, to: 7.1, lines: ['pKa ≈ 7'], leader: true },
  {
    band: 'weak-base',
    from: 7.1,
    to: 15.6,
    lines: ['Weak acid,', 'basic conjugate'],
  },
  { band: 'strong-base', from: 15.6, to: 25, lines: ['Very weak acid'] },
];

export const LEVEL_LABEL_STYLE = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
  height: '18px',
  fontSize: 10,
  color: DIM,
  whiteSpace: 'nowrap',
} as const;

export const MARKER_ROW_STYLE = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  height: '20px',
} as const;

export const MARKER_CHIP_STYLE = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 3,
  padding: '0 3px',
  borderRadius: 3,
  background: 'rgba(255, 255, 255, 0.92)',
  fontSize: 10,
  fontWeight: 600,
  color: MARK,
  whiteSpace: 'nowrap',
} as const;

/**
 * Where a pKa sits on the axis, clamped to the range the scale draws.
 * @param pK - The constant to place.
 * @returns Its ordinate in the `viewBox`.
 */
export function yOf(pK: number): number {
  const clamped = Math.min(Math.max(pK, PK_MIN), PK_MAX);
  return TOP + ((clamped - PK_MIN) / (PK_MAX - PK_MIN)) * (BOTTOM - TOP);
}

/**
 * The ordinate a band label is centred on.
 * @param band - The band to label.
 * @returns Its middle, in the `viewBox`.
 */
export function middleOf(band: ScaleBand): number {
  return (yOf(band.from) + yOf(band.to)) / 2;
}

/**
 * Rewrite the hyphen of a negative number as a typographic minus sign, so the
 * axis and the labels read the same.
 * @param value - An already formatted number.
 * @returns The same text, with a proper minus sign.
 */
export function withMinusSign(value: string): string {
  return value.replace('-', '−');
}

const PK_MIN = -10;
const PK_MAX = 25;
const BOTTOM = 450;
