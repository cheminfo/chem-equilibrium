/** The steep part of a titration curve, where an endpoint can be read. */
export interface PhJump {
  /** Volume of titrant at the steepest point, in mL. */
  volume: number;
  /** Lowest pH the jump reaches. */
  lowPh: number;
  /** Highest pH the jump reaches. */
  highPh: number;
  /** Steepest slope encountered, in pH units per mL, always positive. */
  slope: number;
  /**
   * Whether the jump is sharp enough for a colour indicator to mark it. A rise
   * of less than two pH units is read with an error larger than the experiment
   * is worth.
   */
  usable: boolean;
}

/** How far a curve rises before an indicator can honestly be read on it. */
const USABLE_JUMP_PH = 2;

/** Slope, as a fraction of the steepest one, still counted as part of the jump. */
const JUMP_EDGE_FRACTION = 0.2;

/**
 * Locate the steepest part of a titration curve.
 *
 * The jump is found from the curve itself rather than assumed at the
 * equivalence volume: a very dilute or a very weak analyte simply has no jump,
 * and the tool has to be able to say so.
 * @param volumes - Volume of titrant added at each point, in mL.
 * @param ph - pH at each point.
 * @returns The jump, or `null` when the curve is too short to have one.
 */
export function findJump(volumes: number[], ph: number[]): PhJump | null {
  const count = Math.min(volumes.length, ph.length);
  if (count < 3) return null;

  let steepest = 0;
  let steepestIndex = -1;
  for (let i = 1; i < count; i++) {
    const slope = slopeAt(volumes, ph, i);
    if (slope > steepest) {
      steepest = slope;
      steepestIndex = i;
    }
  }
  if (steepestIndex === -1 || !Number.isFinite(steepest) || steepest === 0) {
    return null;
  }

  const edge = steepest * JUMP_EDGE_FRACTION;
  let low = steepestIndex;
  let high = steepestIndex;
  while (low > 1 && slopeAt(volumes, ph, low - 1) >= edge) low--;
  while (high < count - 1 && slopeAt(volumes, ph, high + 1) >= edge) high++;

  const startPh = ph[low - 1] ?? Number.NaN;
  const endPh = ph[high] ?? Number.NaN;
  const before = volumes[steepestIndex - 1] ?? Number.NaN;
  const after = volumes[steepestIndex] ?? Number.NaN;

  return {
    volume: (before + after) / 2,
    lowPh: Math.min(startPh, endPh),
    highPh: Math.max(startPh, endPh),
    slope: steepest,
    usable: Math.abs(endPh - startPh) >= USABLE_JUMP_PH,
  };
}

/**
 * Volume of titrant at which its amount matches the analyte's, one for one.
 * @param analyteConcentration - Concentration of the analyte, in mol/L.
 * @param analyteVolume - Volume of analyte, in mL.
 * @param titrantConcentration - Concentration of the titrant, in mol/L.
 * @returns The equivalence volume in mL, or `undefined` when it is undefined.
 */
export function equivalenceVolume(
  analyteConcentration: number,
  analyteVolume: number,
  titrantConcentration: number,
): number | undefined {
  if (titrantConcentration <= 0) return undefined;
  const volume = (analyteConcentration * analyteVolume) / titrantConcentration;
  return Number.isFinite(volume) ? volume : undefined;
}

/**
 * Volume at which the curve first reaches a pH, interpolated between points.
 * @param volumes - Volume of titrant added at each point, in mL.
 * @param ph - pH at each point.
 * @param target - The pH to look for.
 * @returns The volume in mL, or `undefined` when the curve never reaches it.
 */
export function volumeAtPh(
  volumes: number[],
  ph: number[],
  target: number,
): number | undefined {
  const count = Math.min(volumes.length, ph.length);
  for (let i = 1; i < count; i++) {
    const before = ph[i - 1] ?? Number.NaN;
    const after = ph[i] ?? Number.NaN;
    if (before === target) return volumes[i - 1];
    if (
      (before < target && after >= target) ||
      (before > target && after <= target)
    ) {
      const span = after - before;
      const ratio = span === 0 ? 0 : (target - before) / span;
      const from = volumes[i - 1] ?? Number.NaN;
      const to = volumes[i] ?? Number.NaN;
      return from + (to - from) * ratio;
    }
  }
  return undefined;
}

/**
 * Format a pH the way the indicator table writes one.
 * @param value - The pH.
 * @returns One decimal at most.
 */
export function formatPh(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(1).replace(/\.0$/, '');
}

/**
 * The whole curve as tab-separated values, ready to paste in a spreadsheet.
 * @param volumes - Volume of titrant added at each point, in mL.
 * @param ph - pH at each point.
 * @returns One header line and one line per point.
 */
export function titrationTsv(volumes: number[], ph: number[]): string {
  const count = Math.min(volumes.length, ph.length);
  const lines: string[] = ['volume(mL)\tpH'];
  for (let i = 0; i < count; i++) {
    lines.push(
      `${(volumes[i] ?? Number.NaN).toPrecision(6)}\t${(ph[i] ?? Number.NaN).toFixed(4)}`,
    );
  }
  return lines.join('\n');
}

function slopeAt(volumes: number[], ph: number[], index: number): number {
  const width =
    (volumes[index] ?? Number.NaN) - (volumes[index - 1] ?? Number.NaN);
  if (!(width > 0)) return 0;
  const rise = (ph[index] ?? Number.NaN) - (ph[index - 1] ?? Number.NaN);
  return Number.isFinite(rise) ? Math.abs(rise) / width : 0;
}
