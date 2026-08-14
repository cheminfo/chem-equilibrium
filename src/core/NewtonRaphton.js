import createDebug from 'debug';
import { Matrix, inverse } from 'ml-matrix';

const debug = createDebug('core:newton-raphton');

const defaultOptions = {
  tolerance: 1e-15,
  solidTolerance: 1e-5,
  maxIterations: 99,
};

/**
 * Solve a chemical equilibrium with the Newton-Raphson algorithm.
 * @param {Array<Array<number>>} model - Stoechiometric coefficients of the reactions, one row per component.
 * @param {Array<number>} beta - Equilibrium constant of each reaction.
 * @param {Array<number>} cTotal - Total concentration of each component.
 * @param {Array<number>} c - Initial component concentrations. Initialization is up to the caller.
 * @param {Array<Array<number>>} [solidModel] - Stoechiometric coefficients of the precipitation reactions.
 * @param {Array<number>} [solidKsp] - Solubility constants.
 * @param {Array<number>} [solidC] - Initial solid species "concentrations".
 * @param {object} [options] - Tuning of the optimization algorithm.
 * @param {number} [options.tolerance=1e-15] - Convergence tolerance on the dissolved species.
 * @param {number} [options.solidTolerance=1e-5] - Convergence tolerance on the solid species.
 * @param {number} [options.maxIterations=99] - Maximum number of iterations before giving up.
 * @returns {Array<number>|null} Concentration of each specie, or null if the algorithm did not converge.
 */
export default function newtonRaphton(
  model,
  beta,
  cTotal,
  c,
  solidModel,
  solidKsp,
  solidC,
  options,
) {
  options = { ...defaultOptions, ...options };
  const ncomp = cTotal.length;
  const nspec = beta.length;

  if (!solidModel) solidModel = new Array(ncomp).fill(0).map(() => []);
  if (!solidKsp) solidKsp = [];
  if (!solidC) solidC = [];

  const nsolid = solidKsp.length;

  // Sanity check
  if (
    c.length !== ncomp ||
    model.length !== ncomp ||
    model[0].length !== nspec ||
    solidC.length !== nsolid ||
    solidModel.length !== ncomp ||
    (solidModel[0] && solidModel[0].length !== nsolid)
  ) {
    throw new Error('Invalid arguments');
  }

  // Keep the plain 2D array around: the Jacobian loop reads it element by element.
  const modelRows = model;
  const modelMatrix = new Matrix(model);

  let solidModelMatrix;
  let lnSolidBeta;
  let solidCMatrix;
  if (nsolid) {
    solidModelMatrix = new Matrix(solidModel);
    lnSolidBeta = new Matrix([solidKsp.map(Math.log2)]);
    solidCMatrix = new Matrix([solidC]);
  }

  // Prevent numerical difficulties
  for (let i = 0; i < cTotal.length; i++) {
    if (cTotal[i] === 0) cTotal[i] = options.tolerance;
  }

  const cMatrix = new Matrix([c]);
  const componentRange = getRange(0, ncomp - 1);

  let cSpec;
  let iteration;
  // Deliberately kept across iterations: when no solid is picked the previous
  // difference is the one checkSolid looks at.
  let dkOrig;
  for (iteration = 0; iteration < options.maxIterations; iteration++) {
    // First we determine which solids are not completely dissolved and need to be included in newton
    // For this we compute the solubility products and compare it to the equilibrium constants
    const solidIndices = [];
    let Ksp;
    let lnKsp;
    if (nsolid) {
      Ksp = cMatrix
        .transpose()
        .repeat({ rows: 1, columns: nsolid })
        .powM(solidModelMatrix)
        .product('column');
      for (let idx = 0; idx < Ksp.length; idx++) {
        const k = Ksp[idx];
        if (k > solidKsp[idx]) {
          // The computed solubility product is greater than maximum value
          solidIndices.push(idx);
        } else if (solidCMatrix.get(0, idx) > 0) {
          // solid concentration is not 0
          solidIndices.push(idx);
        } else if (Math.abs(k - solidKsp[idx]) < options.tolerance) {
          // diff is negative but small, we keep it in the model
          solidIndices.push(idx);
        }
      }
      lnKsp = new Array(Ksp.length);
      for (let j = 0; j < Ksp.length; j++) {
        lnKsp[j] = Math.log2(Ksp[j]);
      }
    }

    const nSolidPicked = solidIndices.length;
    let solidCPicked;
    let solidModelPicked;
    if (nSolidPicked) {
      solidCPicked = solidCMatrix.selection([0], solidIndices);
      solidModelPicked = solidModelMatrix.selection(
        componentRange,
        solidIndices,
      );
    }

    const njstar = ncomp + nSolidPicked;

    // Calculate all species concentrations from component concentrations
    cSpec = Matrix.multiply(
      [
        cMatrix
          .transpose()
          .repeat({ rows: 1, columns: nspec })
          .powM(modelMatrix)
          .product('column'),
      ],
      [beta],
    );

    // Compute total concentration of each component based on dissolved species
    const cTotCalc = new Matrix([
      Matrix.multiply(
        cSpec.repeat({ rows: ncomp, columns: 1 }),
        modelMatrix,
      ).sum('row'),
    ]);

    // Add to it "concentrations" based on solid species
    if (nsolid) {
      cTotCalc.add([
        Matrix.multiply(
          solidCMatrix.repeat({ rows: ncomp, columns: 1 }),
          solidModelMatrix,
        ).sum('row'),
      ]);
    }

    // d is the difference between expected total concentration and actual total concentration given
    const d = Matrix.subtract([cTotal], cTotCalc);
    let dAll;
    if (nSolidPicked) {
      const dK = Matrix.subtract(lnSolidBeta, [lnKsp]).selection(
        [0],
        solidIndices,
      );
      dkOrig = Matrix.subtract([solidKsp], [Ksp]);
      dAll = new Matrix(1, njstar);
      dAll.setSubMatrix(d, 0, 0);
      dAll.setSubMatrix(dK, 0, ncomp);
    } else {
      dAll = d;
    }

    if (
      checkEpsilon(options.tolerance, d) &&
      checkSolid(options.solidTolerance, solidCMatrix, dkOrig, nsolid)
    ) {
      debug(`solution converged in ${iteration} iterations`);
      return toResult(cSpec, solidCMatrix, solidC, nsolid);
    }

    // We decompose the Jacobian (Jstar is symetric and easier to inverse)
    const jstar = new Array(njstar);
    for (let row = 0; row < njstar; row++) {
      jstar[row] = new Array(njstar).fill(0);
    }

    const cSpecRow = cSpec.getRow(0);

    // Fill the part of Jstar specific to dissolved variables
    for (let j = 0; j < ncomp; j++) {
      for (let k = j; k < ncomp; k++) {
        for (let l = 0; l < nspec; l++) {
          jstar[j][k] += modelRows[k][l] * modelRows[j][l] * cSpecRow[l];
          jstar[k][j] = jstar[j][k];
        }
      }
    }

    // Fill the part of jstar specific to solid part
    for (let j = 0; j < ncomp; j++) {
      for (let k = 0; k < nSolidPicked; k++) {
        const jk = k + ncomp;
        jstar[j][jk] = solidModelPicked.get(j, k);
        jstar[jk][j] = solidModelPicked.get(j, k);
      }
    }

    // We compute the next delta of component concentrations and apply it to the current component concentrations
    const diag = Matrix.identity(njstar).setSubMatrix(
      Matrix.diag(cMatrix.getRow(0)),
      0,
      0,
    );
    let deltaC = dAll.mmul(inverse(new Matrix(jstar))).mmul(diag);

    const allC = new Matrix(1, njstar);
    allC.setSubMatrix(cMatrix, 0, 0);
    if (nSolidPicked) {
      allC.setSubMatrix(solidCPicked, 0, ncomp);
    }
    allC.add(deltaC);

    // c should be positive. If it's not we want to subtract some of the deltaC we've added
    // We do this iteratively until either nothing is negative anymore or deltaC has become very small
    while (checkNeg(allC)) {
      deltaC = deltaC.multiply(0.5);
      allC.subtract(deltaC);
      if (checkEpsilon(options.tolerance, deltaC)) break;
    }

    for (let j = 0; j < cMatrix.columns; j++) {
      cMatrix.set(0, j, allC.get(0, j));
    }
    for (let j = 0; j < nSolidPicked; j++) {
      const value = allC.get(0, ncomp + j);
      solidCMatrix.set(0, solidIndices[j], Math.max(value, 0));
    }
  }

  if (iteration >= options.maxIterations) {
    debug('did not converge');
    return null;
  }

  return toResult(cSpec, solidCMatrix, solidC, nsolid);
}

function toResult(cSpec, solidCMatrix, solidC, nsolid) {
  return cSpec.to1DArray().concat(nsolid ? solidCMatrix.to1DArray() : solidC);
}

// Returns true if all elements of the single-row matrix are smaller than tolerance
function checkEpsilon(tolerance, row) {
  for (let i = 0; i < row.columns; i++) {
    if (Math.abs(row.get(0, i)) >= tolerance) return false;
  }
  return true;
}

function checkSolid(tolerance, solidC, dk, nsolid) {
  if (!nsolid) return true;
  for (let idx = 0; idx < solidC.columns; idx++) {
    if (solidC.get(0, idx) === 0) continue;
    if (dk === undefined || dk.get(0, idx) === undefined) {
      throw new Error('Missing solubility product difference');
    }
    if (Math.abs(dk.get(0, idx)) >= tolerance) return false;
  }
  return true;
}

// return true if any element of the single-row matrix is negative
function checkNeg(row) {
  for (let i = 0; i < row.columns; i++) {
    if (row.get(0, i) <= 0) return true;
  }
  return false;
}

function getRange(start, end) {
  const range = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}
