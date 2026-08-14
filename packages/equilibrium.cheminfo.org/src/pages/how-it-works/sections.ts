/** The sections of the page, in reading order. */
export const HOW_SECTIONS = [
  { id: 'idea', title: 'The idea' },
  { id: 'mass-action', title: 'The law of mass action' },
  { id: 'pk', title: 'The pK convention' },
  { id: 'mass-balance', title: 'Mass balance' },
  { id: 'normalization', title: 'Normalization' },
  { id: 'fixed', title: 'Imposing a concentration' },
  { id: 'newton', title: 'Newton-Raphson' },
  { id: 'solids', title: 'Solids' },
  { id: 'convergence', title: 'Convergence and its limits' },
  { id: 'continuation', title: 'Continuation' },
  { id: 'assumptions', title: 'What the model assumes' },
] as const;

export type SectionId = (typeof HOW_SECTIONS)[number]['id'];

/**
 * Whether a string names one of the sections.
 * @param value - Candidate identifier, typically read from the URL.
 * @returns Whether it can be used as a section identifier.
 */
export function isSectionId(value: string): value is SectionId {
  return HOW_SECTIONS.some((section) => section.id === value);
}

/**
 * Position of a section in the reading order, counted from one.
 * @param id - Identifier of the section.
 * @returns Its number, or 0 when it is unknown.
 */
export function numberOf(id: SectionId): number {
  return HOW_SECTIONS.findIndex((section) => section.id === id) + 1;
}

/**
 * Title of a section.
 * @param id - Identifier of the section.
 * @returns The title shown in the navigation and in the heading.
 */
export function titleOf(id: SectionId): string {
  return HOW_SECTIONS.find((section) => section.id === id)?.title ?? id;
}
