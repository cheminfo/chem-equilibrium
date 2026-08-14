import type { IconName } from '@blueprintjs/icons';
import type { ReactNode } from 'react';

import { Species } from '../../components/Species.tsx';
import type { ToolPath } from '../../routes.ts';

/** A tool as the landing page presents it, with a configuration to open. */
export interface ToolExample {
  icon: IconName;
  /** One line on what the tool is for. */
  summary: ReactNode;
  /** The question the worked example answers. */
  question: ReactNode;
  /**
   * Parameters of the worked example, named exactly as the tool reads them, so
   * the button lands on a page that is already solved rather than on a blank one.
   */
  query: Record<string, string>;
}

/**
 * One worked example per tool, keyed by route: because the record covers every
 * `TOOL_PATHS` entry, a tool cannot be added to the site without the home page
 * gaining a card for it.
 */
export const TOOL_EXAMPLES: Record<ToolPath, ToolExample> = {
  '/ph': {
    icon: 'calculator',
    summary:
      'The pH of a solution of one acid or base, with every equilibrium of the system kept in — water included.',
    question: 'What is the pH of 0.1 M acetic acid?',
    query: { acid: 'CH3CO2H', c: '0.1' },
  },
  '/titration': {
    icon: 'timeline-line-chart',
    summary:
      'A whole titration curve, its equivalence points, and the colour a chosen indicator would show along it.',
    question: (
      <>
        Which indicator should I use to titrate <Species label="CO3--" /> with{' '}
        <Species label="HCl" />?
      </>
    ),
    query: {
      a: 'CO3--',
      ac: '0.1',
      av: '20',
      t: 'HCl',
      tc: '0.1',
      tv: '50',
      ind: 'methyl orange',
    },
  },
  '/speciation': {
    icon: 'series-derived',
    summary:
      'A distribution diagram: which form of each acid/base couple exists at each imposed pH.',
    question: (
      <>
        Which form of <Species label="H3PO4" /> dominates at pH 7?
      </>
    ),
    query: { s: 'H3PO4:0.1' },
  },
  '/precipitation': {
    icon: 'layers',
    summary:
      'The same diagram over the whole database, complexes and solid phases together.',
    question: (
      <>
        At what pH does solid <Species label="AgOH" /> appear, and why does{' '}
        <Species label="NH3" /> hold it back?
      </>
    ),
    query: { s: 'Ag+:0.01,NH3:0.1' },
  },
  '/equilibrium': {
    icon: 'function',
    summary:
      'The general tool: sweep any component of the system, imposed or total, on any scale and over any range.',
    question: (
      <>
        Why does <Species label="Cl-" /> first precipitate{' '}
        <Species label="AgCl" /> and then dissolve it again?
      </>
    ),
    query: {
      s: 'Ag+:0.01,Cl-:0.01',
      v: 'Cl-',
      fix: '1',
      lg: '1',
      from: '0',
      to: '6',
    },
  },
  '/exercises': {
    icon: 'learning',
    summary:
      'Generated pH questions, each answered with the simplified formula and then checked against the exact solution.',
    question:
      'Ten questions on strong and weak acids, identical for the whole class.',
    query: { seed: '42', n: '10' },
  },
};
