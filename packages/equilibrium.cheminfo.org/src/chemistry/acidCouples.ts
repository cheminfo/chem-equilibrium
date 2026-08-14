import type { DatabaseEntry } from 'chem-equilibrium';
import { database } from 'chem-equilibrium';

import { matchesSpecies } from './species.ts';

/** One acid/base couple of the bundled database, as the pH calculator offers it. */
export interface AcidCouple {
  /** The protonated species, which is what the student picks. */
  acid: string;
  /** The conjugate base it releases; empty when the entry declares none. */
  base: string;
  /** pKa of the couple. */
  pK: number;
  /** The equilibrium itself, for rendering it with `EquationText`. */
  equation: DatabaseEntry;
}

/**
 * Every acid/base couple of the bundled database, strongest acid first.
 *
 * The intermediates of a polyprotic acid are couples in their own right, which
 * is why `H2PO4-` can be picked as readily as `H3PO4`.
 */
export const ACID_COUPLES: AcidCouple[] = collectCouples();

/**
 * Find a couple by the acid it is named after.
 * @param acid - Label of the protonated species.
 * @returns The couple, or `undefined` when no equilibrium forms that species.
 */
export function findCouple(acid: string): AcidCouple | undefined {
  return ACID_COUPLES.find((couple) => couple.acid === acid);
}

/**
 * Match a couple against a free-text query.
 *
 * Both members of the couple are searched, so `acetate` and `acetic acid` reach
 * the same row; so is the pKa itself, for a student looking up a value.
 * @param couple - The couple to test.
 * @param query - What the user typed.
 * @returns Whether the couple should be shown.
 */
export function matchesCouple(couple: AcidCouple, query: string): boolean {
  const needle = query.trim();
  if (!needle) return true;
  return (
    matchesSpecies(couple.acid, needle) ||
    matchesSpecies(couple.base, needle) ||
    String(couple.pK).includes(needle)
  );
}

function collectCouples(): AcidCouple[] {
  const couples: AcidCouple[] = [];
  for (const entry of database) {
    if (entry.type !== 'acidoBasic') continue;
    couples.push(toCouple(entry));
  }
  couples.sort((a, b) => a.pK - b.pK);
  return couples;
}

function toCouple(entry: DatabaseEntry): AcidCouple {
  const base = Object.keys(entry.components).find((label) => label !== 'H+');
  return {
    acid: entry.formed,
    base: base ?? '',
    pK: entry.pK,
    equation: entry,
  };
}
