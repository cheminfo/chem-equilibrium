/** One colour change of an indicator, over a pH range. */
export interface Transition {
  /** Which of the indicator's changes this is. */
  transition: string;
  /** pH at which the colour starts to change. */
  pH1: number;
  /** pH at which the change is complete. */
  pH2: number;
  /** Colour of the acid form. */
  color1: string;
  /** Colour of the base form. */
  color2: string;
}

/** A laboratory pH indicator and every colour change it goes through. */
export interface Indicator {
  name: string;
  source: string;
  transitions: Transition[];
}

/** An `[r, g, b]` triple, each component in `[0, 255]`. */
export type Rgb = [number, number, number];

/**
 * The colour an indicator takes at a given pH.
 *
 * Below its first transition it keeps the acid colour and above the last one
 * the base colour; inside a transition the two are mixed linearly in RGB, which
 * is what makes the colour change readable as a gradient rather than a step.
 * @param indicator - The indicator.
 * @param ph - The pH to evaluate.
 * @returns A CSS colour.
 */
export function colorAt(indicator: Indicator, ph: number): string {
  return toCss(rgbAt(indicator, ph));
}

/**
 * The colour an indicator takes at a given pH, as an RGB triple.
 * @param indicator - The indicator.
 * @param ph - The pH to evaluate.
 * @returns The mixed colour.
 */
export function rgbAt(indicator: Indicator, ph: number): Rgb {
  const stops = sortedTransitions(indicator);
  const first = stops[0];
  if (!first) return [255, 255, 255];
  if (ph <= first.pH1) return hexToRgb(first.color1);

  for (const stop of stops) {
    if (ph > stop.pH2) continue;
    if (ph <= stop.pH1) {
      // Between two transitions the indicator keeps the colour it ended on.
      return hexToRgb(stop.color1);
    }
    // A degenerate range (pH1 === pH2) is a step, not a gradient.
    const span = stop.pH2 - stop.pH1;
    const ratio = span === 0 ? 1 : (ph - stop.pH1) / span;
    return mix(hexToRgb(stop.color1), hexToRgb(stop.color2), ratio);
  }

  const last = stops.at(-1) as Transition;
  return hexToRgb(last.color2);
}

/**
 * Sample an indicator across the pH scale, for a colour bar.
 * @param indicator - The indicator.
 * @param steps - How many bands to produce.
 * @param from - Lowest pH.
 * @param to - Highest pH.
 * @returns One band per step, from `from` to `to`.
 */
export function sampleBands(
  indicator: Indicator,
  steps: number,
  from = 0,
  to = 14,
): Array<{ from: number; to: number; color: string }> {
  const bands: Array<{ from: number; to: number; color: string }> = [];
  const width = (to - from) / steps;
  for (let i = 0; i < steps; i++) {
    const low = from + i * width;
    const high = low + width;
    bands.push({
      from: low,
      to: high,
      color: colorAt(indicator, (low + high) / 2),
    });
  }
  return bands;
}

/**
 * A CSS gradient showing the whole colour scale of an indicator.
 * @param indicator - The indicator.
 * @param steps - Resolution of the gradient.
 * @returns A `linear-gradient(...)` value.
 */
export function gradientOf(indicator: Indicator, steps = 60): string {
  const stops = sampleBands(indicator, steps).map(
    (band, index) => `${band.color} ${((index / steps) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/**
 * Whether a colour is light enough that text on it must be dark, and that a
 * colourless indicator form needs an outline to be visible at all.
 * @param color - A CSS colour, either `#rrggbb` as the source table writes it
 * or the `rgb(r, g, b)` a mixed colour comes back as.
 * @returns Whether the colour reads as light.
 */
export function isLight(color: string): boolean {
  const [r, g, b] = parseColor(color);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

function sortedTransitions(indicator: Indicator): Transition[] {
  return indicator.transitions.toSorted((a, b) => a.pH1 - b.pH1);
}

function parseColor(color: string): Rgb {
  if (color.startsWith('#')) return hexToRgb(color);
  const inside = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')'));
  const parts = inside.split(',');
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

function hexToRgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(from: Rgb, to: Rgb, ratio: number): Rgb {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return [
    Math.round(from[0] + (to[0] - from[0]) * clamped),
    Math.round(from[1] + (to[1] - from[1]) * clamped),
    Math.round(from[2] + (to[2] - from[2]) * clamped),
  ];
}

function toCss([r, g, b]: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}
