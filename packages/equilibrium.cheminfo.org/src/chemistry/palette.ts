/**
 * Colour-blind-safe series palette.
 *
 * The first eight are Okabe & Ito's set, which stays distinguishable under
 * every common form of colour vision deficiency; the rest extend it while
 * keeping enough lightness contrast for a dense speciation diagram.
 */
const PALETTE = [
  '#0072b2',
  '#d55e00',
  '#009e73',
  '#cc79a7',
  '#e69f00',
  '#56b4e9',
  '#f0e442',
  '#000000',
  '#7570b3',
  '#a6761d',
  '#66a61e',
  '#e7298a',
  '#1b9e77',
  '#8c564b',
  '#17becf',
  '#bcbd22',
];

/**
 * Assign a stable colour to every series, never repeating one until the palette
 * is exhausted.
 * @param labels - Series labels, in the order they are drawn.
 * @returns The colour of each label.
 */
export function assignColors(labels: string[]): Record<string, string> {
  const colors: Record<string, string> = {};
  for (let i = 0; i < labels.length; i++) {
    colors[labels[i] as string] = PALETTE[i % PALETTE.length] as string;
  }
  return colors;
}
