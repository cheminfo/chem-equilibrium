import { Matrix, inverse } from 'ml-matrix';

import type { SolverOptions } from '../types.ts';

const defaultOptions = {
  tolerance: 1e-15,
  solidTolerance: 1e-5,
  maxIterations: 99,
} satisfies SolverOptions;

/**
 * Solve a chemical equilibrium with the Newton-Raphson algorithm.
 *
 * The unknowns are the free concentrations of the components. Every dissolved
 * species is `beta * prod(c ** coefficient)`, so the residual to cancel is the
 * difference between the analytical total of each component and the total
 * recomputed from those species. Solid phases enter the active set only when
 * their ion product exceeds their solubility product.
 * @param model - Stoichiometric coefficients of the dissolved species, one row per component.
 * @param beta - Formation constant of each dissolved species.
 * @param cTotal - Total concentration of each component.
 * @param c - Starting component concentrations.
 * @param solidModel - Stoichiometric coefficients of the solid species.
 * @param solidKsp - Solubility (dissociation) product of each solid.
 * @param solidC - Starting amounts of the solid species.
 * @param options - Tuning of the algorithm.
 * @returns Concentration of every species, or `null` if it did not converge.
 */
export function newtonRaphton(
  model: number[][],
  beta: number[],
  cTotal: number[],
  c: number[],
  solidModel?: number[][],
  solidKsp?: number[],
  solidC?: number[],
  options?: SolverOptions,
): number[] | null {
  const { tolerance, solidTolerance, maxIterations } = {
    ...defaultOptions,
    ...options,
  };
  const ncomp = cTotal.length;
  const nspec = beta.length;

  const solidStoichiometry =
    solidModel ?? Array.from({ length: ncomp }, (): number[] => []);
  const ksp = solidKsp ?? [];
  const solidAmounts = solidC ?? [];
  const nsolid = ksp.length;

  if (
    c.length !== ncomp ||
    model.length !== ncomp ||
    model[0]?.length !== nspec ||
    solidAmounts.length !== nsolid ||
    solidStoichiometry.length !== ncomp ||
    (solidStoichiometry[0] && solidStoichiometry[0].length !== nsolid)
  ) {
    throw new Error('Invalid arguments');
  }

  const modelMatrix = new Matrix(model);
  let solidModelMatrix: Matrix | undefined;
  let lnSolidBeta: Matrix | undefined;
  let solidCMatrix: Matrix | undefined;
  if (nsolid) {
    solidModelMatrix = new Matrix(solidStoichiometry);
    lnSolidBeta = new Matrix([ksp.map(Math.log2)]);
    solidCMatrix = new Matrix([solidAmounts]);
  }

  // A component that was not introduced at all would make the residual
  // unsolvable in a multiplicative scheme.
  const totals = cTotal.slice();
  for (let i = 0; i < totals.length; i++) {
    if (totals[i] === 0) totals[i] = tolerance;
  }

  const cMatrix = new Matrix([c]);
  const componentRange = getRange(0, ncomp - 1);

  let cSpec: Matrix | undefined;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Decide which solids take part in this iteration: the supersaturated
    // ones, those that already hold matter, and those sitting at saturation.
    const solidIndices: number[] = [];
    let ionProduct: number[] | undefined;
    let lnIonProduct: number[] | undefined;
    if (nsolid && solidModelMatrix && solidCMatrix) {
      ionProduct = cMatrix
        .transpose()
        .repeat({ rows: 1, columns: nsolid })
        .pow(solidModelMatrix)
        .product('column');
      lnIonProduct = new Array<number>(ionProduct.length);
      for (let idx = 0; idx < ionProduct.length; idx++) {
        const value = ionProduct[idx] as number;
        const limit = ksp[idx] as number;
        if (
          value > limit ||
          solidCMatrix.get(0, idx) > 0 ||
          Math.abs(value - limit) < tolerance
        ) {
          solidIndices.push(idx);
        }
        lnIonProduct[idx] = Math.log2(value);
      }
    }

    const nSolidPicked = solidIndices.length;
    let solidCPicked: Matrix | undefined;
    let solidModelPicked: Matrix | undefined;
    if (nSolidPicked && solidCMatrix && solidModelMatrix) {
      solidCPicked = solidCMatrix.selection([0], solidIndices);
      solidModelPicked = solidModelMatrix.selection(
        componentRange,
        solidIndices,
      );
    }

    const njstar = ncomp + nSolidPicked;

    // Concentration of every dissolved species from the free components.
    cSpec = Matrix.multiply(
      [
        cMatrix
          .transpose()
          .repeat({ rows: 1, columns: nspec })
          .pow(modelMatrix)
          .product('column'),
      ],
      [beta],
    );

    const cTotCalc = new Matrix([
      Matrix.multiply(
        cSpec.repeat({ rows: ncomp, columns: 1 }),
        modelMatrix,
      ).sum('row'),
    ]);
    if (nsolid && solidCMatrix && solidModelMatrix) {
      cTotCalc.add([
        Matrix.multiply(
          solidCMatrix.repeat({ rows: ncomp, columns: 1 }),
          solidModelMatrix,
        ).sum('row'),
      ]);
    }

    const d = Matrix.subtract([totals], cTotCalc);
    let dAll = d;
    if (nSolidPicked && lnSolidBeta && lnIonProduct) {
      const dK = Matrix.subtract(lnSolidBeta, [lnIonProduct]).selection(
        [0],
        solidIndices,
      );
      dAll = new Matrix(1, njstar);
      dAll.setSubMatrix(d, 0, 0);
      dAll.setSubMatrix(dK, 0, ncomp);
    }

    if (
      checkEpsilon(tolerance, d) &&
      checkSolid(solidTolerance, solidCMatrix, ionProduct, ksp)
    ) {
      return toResult(cSpec, solidCMatrix, solidAmounts, nsolid);
    }

    // J* is symmetric, which makes it cheaper to invert than the full Jacobian.
    const jstar: number[][] = [];
    for (let row = 0; row < njstar; row++) {
      jstar.push(new Array<number>(njstar).fill(0));
    }

    const cSpecRow = cSpec.getRow(0);
    for (let j = 0; j < ncomp; j++) {
      const modelJ = model[j] as number[];
      const jstarJ = jstar[j] as number[];
      for (let k = j; k < ncomp; k++) {
        const modelK = model[k] as number[];
        let sum = 0;
        for (let l = 0; l < nspec; l++) {
          sum +=
            (modelK[l] as number) *
            (modelJ[l] as number) *
            (cSpecRow[l] as number);
        }
        jstarJ[k] = sum;
        (jstar[k] as number[])[j] = sum;
      }
    }
    if (solidModelPicked) {
      for (let j = 0; j < ncomp; j++) {
        for (let k = 0; k < nSolidPicked; k++) {
          const value = solidModelPicked.get(j, k);
          (jstar[j] as number[])[k + ncomp] = value;
          (jstar[k + ncomp] as number[])[j] = value;
        }
      }
    }

    const diag = Matrix.identity(njstar).setSubMatrix(
      Matrix.diag(cMatrix.getRow(0)),
      0,
      0,
    );
    let deltaC = dAll.mmul(inverse(new Matrix(jstar))).mmul(diag);

    const allC = new Matrix(1, njstar);
    allC.setSubMatrix(cMatrix, 0, 0);
    if (solidCPicked) allC.setSubMatrix(solidCPicked, 0, ncomp);
    allC.add(deltaC);

    // Concentrations must stay positive: back off along the step until they are.
    while (checkNeg(allC)) {
      deltaC = deltaC.multiply(0.5);
      allC.subtract(deltaC);
      if (checkEpsilon(tolerance, deltaC)) break;
    }

    for (let j = 0; j < cMatrix.columns; j++) {
      cMatrix.set(0, j, allC.get(0, j));
    }
    if (solidCMatrix) {
      for (let j = 0; j < nSolidPicked; j++) {
        solidCMatrix.set(
          0,
          solidIndices[j] as number,
          Math.max(allC.get(0, ncomp + j), 0),
        );
      }
    }
  }

  return null;
}

function toResult(
  cSpec: Matrix,
  solidCMatrix: Matrix | undefined,
  solidC: number[],
  nsolid: number,
): number[] {
  return cSpec
    .to1DArray()
    .concat(nsolid && solidCMatrix ? solidCMatrix.to1DArray() : solidC);
}

/**
 * True when every element of the single-row matrix is smaller than the tolerance.
 * @param tolerance - Value every element must stay under.
 * @param row - The single-row matrix to test.
 * @returns Whether the whole row is within the tolerance.
 */
function checkEpsilon(tolerance: number, row: Matrix): boolean {
  for (let i = 0; i < row.columns; i++) {
    if (Math.abs(row.get(0, i)) >= tolerance) return false;
  }
  return true;
}

/**
 * True when every solid that holds matter sits on its solubility product.
 *
 * Solubility products span some sixty decades, so an absolute comparison alone
 * can never be met by the large ones; the relative test is what makes hydroxide
 * precipitation converge.
 * @param tolerance - Convergence tolerance on the solubility products.
 * @param solidC - Current amount of each solid.
 * @param ionProduct - Ion product of each solid.
 * @param solidKsp - Solubility product of each solid.
 * @returns Whether the solid part of the system has converged.
 */
function checkSolid(
  tolerance: number,
  solidC: Matrix | undefined,
  ionProduct: number[] | undefined,
  solidKsp: number[],
): boolean {
  if (!solidC || !ionProduct) return true;
  for (let idx = 0; idx < solidC.columns; idx++) {
    if (solidC.get(0, idx) === 0) continue;
    const target = solidKsp[idx] as number;
    const value = ionProduct[idx] as number;
    const absolute = Math.abs(target - value);
    if (absolute < tolerance) continue;
    if (target !== 0 && Math.abs(1 - value / target) < tolerance) continue;
    return false;
  }
  return true;
}

/**
 * True when any element of the single-row matrix is negative or zero.
 * @param row - The single-row matrix to test.
 * @returns Whether the step made a concentration non-positive.
 */
function checkNeg(row: Matrix): boolean {
  for (let i = 0; i < row.columns; i++) {
    if (row.get(0, i) <= 0) return true;
  }
  return false;
}

function getRange(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) range.push(i);
  return range;
}
