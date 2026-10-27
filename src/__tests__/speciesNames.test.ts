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

const AMINO_ACID =
  /Ala|Arg|Asn|Asp|Cys|Gln|Glu|Gly|His|Ile|Leu|Lys|Met|Phe|Pro|Ser|Thr|Trp|Tyr|Val/;

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

test('a species is drawn when its structure says more than its formula', () => {
  const undrawn = Object.keys(speciesNames).filter(
    (label) => speciesNames[label]?.idCode === undefined,
  );
  const unneeded = DRAWN.filter(
    ([, { idCode }]) => !saysMoreThanFormula(Molecule.fromIDCode(idCode)),
  );

  expect(unneeded).toStrictEqual([]);
  expect(DRAWN).toHaveLength(180);
  expect(DRAWN.filter(([label]) => AMINO_ACID.test(label))).toHaveLength(67);
  expect(undrawn).toHaveLength(96);
  expect(undrawn).toStrictEqual(
    expect.arrayContaining([
      'Cl-',
      'H2O',
      'NH4+',
      'Mn(OH)2',
      'Hg2Cl2',
      'Fe(H2O)6+++',
      'HgCl4--',
      'Cu(NH3)4++',
    ]),
  );
  expect(speciesNames['Fe(CN)6----']?.idCode).toBe(
    'dkM`cnFUtpV@VNSlxnkfyJjeUZjo\u007FpA~[ABXU@',
  );
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
    const code = AMINO_ACID.exec(label)?.[0];
    if (!code) continue;
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
    if (labelMF(label) !== structureMF(Molecule.fromIDCode(idCode))) {
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

  expect(couples).toBe(90);
  expect(mismatches).toStrictEqual([]);
});

test('a complex or a precipitate is drawn as exactly its components', () => {
  const mismatches: string[] = [];
  let checked = 0;
  for (const entry of database) {
    const formed = speciesNames[entry.formed]?.idCode;
    if (entry.type === 'acidoBasic' || !formed) continue;
    checked++;
    // A component that is not drawn is known by its formula.
    const expected: string[] = [];
    for (const [label, coefficient] of Object.entries(entry.components)) {
      for (let index = 0; index < coefficient; index++) {
        expected.push(speciesNames[label]?.idCode ?? labelMF(label));
      }
    }
    const found = freeSpecies(Molecule.fromIDCode(formed)).map((fragment) =>
      saysMoreThanFormula(fragment)
        ? fragment.getIDCode()
        : structureMF(fragment),
    );
    if (String(found.toSorted()) !== String(expected.toSorted())) {
      mismatches.push(entry.formed);
    }
  }

  expect(checked).toBe(34);
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

/**
 * The free species a structure is made of: its fragments once every
 * metal–ligand bond is broken.
 * @param molecule - The molecule.
 * @returns Its fragments.
 */
function freeSpecies(molecule: Molecule): Molecule[] {
  const copy = molecule.getCompactCopy();
  for (let bond = copy.getAllBonds() - 1; bond >= 0; bond--) {
    if (copy.getBondType(bond) === Molecule.cBondTypeMetalLigand) {
      copy.deleteBond(bond);
    }
  }
  return copy.getFragments();
}

/**
 * Whether a drawing tells more than the formula: a structure made only of
 * single atoms with their hydrogens — Mn²⁺ and OH⁻, Hg₂²⁺ and Cl⁻, Fe³⁺ bound
 * to H₂O — is read from the formula alone.
 * @param molecule - The molecule.
 * @returns Whether a free species of it bonds two different elements.
 */
function saysMoreThanFormula(molecule: Molecule): boolean {
  for (const fragment of freeSpecies(molecule)) {
    const elements = new Set<number>();
    for (let atom = 0; atom < fragment.getAllAtoms(); atom++) {
      const atomicNo = fragment.getAtomicNo(atom);
      if (atomicNo !== 1) elements.add(atomicNo);
    }
    if (elements.size > 1) return true;
  }
  return false;
}

function labelMF(label: string): string {
  return new MF(
    label.replace(
      /(?<signs>\++|-+)$/,
      (signs) => `(${signs[0]}${signs.length})`,
    ),
  ).getInfo().mf;
}

// openchemlib does not write the Hill order mf-parser does.
function structureMF(molecule: Molecule): string {
  const charge = netCharge(molecule);
  const { formula } = molecule.getMolecularFormula();
  return new MF(
    charge ? `${formula}(${charge > 0 ? '+' : ''}${charge})` : formula,
  ).getInfo().mf;
}

function labelCharge(label: string): number {
  const signs = /(?<signs>\++|-+)$/.exec(label)?.groups?.signs ?? '';
  return signs.startsWith('-') ? -signs.length : signs.length;
}
