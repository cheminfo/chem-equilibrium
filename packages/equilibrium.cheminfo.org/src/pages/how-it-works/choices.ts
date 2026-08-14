/** Acids whose system is small enough to read every iteration of. */
export const NEWTON_ACIDS = [
  'CH3CO2H',
  'H3PO4',
  'H2CO3',
  'HCO3-',
  'CO3--',
  'NH4+',
];

/**
 * Acid families whose members all carry a single unit of the component, which
 * is what makes the reduced system linear.
 */
export const FAMILIES = ['CO3--', 'PO4---', 'CH3COO-', 'NH3'];
