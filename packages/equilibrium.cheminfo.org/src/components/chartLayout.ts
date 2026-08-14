import type { Margin } from '@nivo/core';

/**
 * Plot area of `EquilibriumChart`, in pixels.
 *
 * Anything laid over the chart rather than drawn by it — the equivalence
 * markers of a titration, for one — has to know where the axes leave the data
 * area, so the margins are shared instead of being repeated on both sides.
 */
export const PLOT_MARGIN: Margin = {
  top: 16,
  right: 24,
  bottom: 88,
  left: 72,
};
