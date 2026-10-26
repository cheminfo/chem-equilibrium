import { expandChemicalGroups } from 'expand-chemical-groups';
import { MF } from 'mf-parser';
import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { database } from '../data/database.ts';
import { speciesNames } from '../data/speciesNames.ts';
import { Helper } from '../helpers/Helper.ts';

import { value } from './data/solutionValue.ts';

const DRAWN = Object.entries(speciesNames).filter(
  (entry): entry is [string, { name: string; idCode: string }] =>
    entry[1].idCode !== undefined,
);

test('every species an active equilibrium uses is named', () => {
  const unnamed = new Set<string>();
  for (const entry of database) {
    if (entry.active === false) continue;
    for (const label of [entry.formed, ...Object.keys(entry.components)]) {
      if (!speciesNames[label]) unnamed.add(label);
    }
  }

  expect(unnamed).toStrictEqual(new Set());
});

test('the 20 amino acids are drawn in every protonation state', () => {
  expect(DRAWN).toHaveLength(67);
  expect(speciesNames.HGlyOH).toStrictEqual({
    name: 'glycine',
    alternatives: [
      'Gly',
      'H-Gly-OH',
      '2-aminoacetic acid',
      'glycine zwitterion',
    ],
    idCode: 'gJX`bDnLiMmP@',
  });
});

test('every amino acid is its chemical-groups structure, charges aside', () => {
  const mismatches: string[] = [];
  for (const [label, { idCode }] of DRAWN) {
    const code = /[A-Z][a-z]{2}/.exec(label)?.[0] ?? label;
    const reference = expandChemicalGroups(`H${code}OH`);
    if (skeleton(Molecule.fromIDCode(idCode)) !== skeleton(reference)) {
      mismatches.push(label);
    }
  }

  expect(mismatches).toStrictEqual([]);
});

test('every label reads, in mf-parser, the formula of its structure', () => {
  const mismatches: string[] = [];
  for (const [label, { idCode }] of DRAWN) {
    const written = new MF(
      label.replace(
        /(?<signs>\++|-+)$/,
        (signs) => `(${signs[0]}${signs.length})`,
      ),
    ).getInfo();
    const drawn = Molecule.fromIDCode(idCode);
    if (
      written.mf.replace(/\(.*\)$/, '') !==
        drawn.getMolecularFormula().formula ||
      written.charge !== netCharge(drawn)
    ) {
      mismatches.push(label);
    }
  }

  expect(mismatches).toStrictEqual([]);
});

test('every structure carries the charge its label ends with', () => {
  const mismatches: string[] = [];
  for (const [label, { idCode }] of DRAWN) {
    if (netCharge(Molecule.fromIDCode(idCode)) !== labelCharge(label)) {
      mismatches.push(label);
    }
  }

  expect(mismatches).toStrictEqual([]);
});

test('the two structures of a couple differ by exactly one hydrogen', () => {
  const mismatches: string[] = [];
  let couples = 0;
  for (const entry of database) {
    if (entry.type !== 'acidoBasic') continue;
    const base = Object.keys(entry.components).find((label) => label !== 'H+');
    const acidIdCode = speciesNames[entry.formed]?.idCode;
    const baseIdCode = base ? speciesNames[base]?.idCode : undefined;
    if (!acidIdCode || !baseIdCode) continue;
    couples++;
    const acid = Molecule.fromIDCode(acidIdCode);
    const conjugate = Molecule.fromIDCode(baseIdCode);
    const proton = conjugate.addAtom(1);
    conjugate.setAtomCharge(proton, 1);
    if (
      acid.getMolecularFormula().formula !==
      conjugate.getMolecularFormula().formula
    ) {
      mismatches.push(entry.formed);
    }
  }

  expect(couples).toBe(47);
  expect(mismatches).toStrictEqual([]);
});

test('a solution of glycine settles at its isoelectric point', () => {
  const helper = new Helper();
  helper.addSpecie('HGlyOH', 0.1);
  const solution = helper.getEquilibrium().solveRobust();
  const pH = -Math.log10(value(solution, 'H+'));

  // pI = (pK1 + pK2) / 2 = 6.065, which water shifts by under 0.01 at 0.1 M.
  expect(pH).toBeCloseTo(6.07, 2);
});

function netCharge(molecule: Molecule): number {
  let charge = 0;
  for (let atom = 0; atom < molecule.getAllAtoms(); atom++) {
    charge += molecule.getAtomCharge(atom);
  }
  return charge;
}

/**
 * What protonation and resonance leave alone: connectivity and stereo, read
 * with every charge removed and every bond single.
 * @param molecule - The molecule.
 * @returns The idCode of its skeleton.
 */
function skeleton(molecule: Molecule): string {
  const copy = molecule.getCompactCopy();
  for (let atom = 0; atom < copy.getAllAtoms(); atom++) {
    copy.setAtomCharge(atom, 0);
  }
  for (let bond = 0; bond < copy.getAllBonds(); bond++) {
    if (copy.getBondOrder(bond) > 1) copy.setBondOrder(bond, 1);
  }
  return copy.getIDCode();
}

function labelCharge(label: string): number {
  const signs = /(?<signs>\++|-+)$/.exec(label)?.groups?.signs ?? '';
  return signs.startsWith('-') ? -signs.length : signs.length;
}
