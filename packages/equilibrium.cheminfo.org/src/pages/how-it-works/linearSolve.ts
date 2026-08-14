/**
 * Solve `A x = b` by Gauss-Jordan elimination with partial pivoting.
 *
 * The systems on this page have at most a handful of unknowns, so a direct
 * elimination is both the clearest and the fastest thing to do; the library
 * itself inverts the same matrix with an LU decomposition.
 * @param a - Square matrix, one array per row.
 * @param b - Right-hand side.
 * @returns The solution, or `null` when the matrix is singular.
 */
export function solveLinear(a: number[][], b: number[]): number[] | null {
  const size = b.length;
  const augmented: number[][] = [];
  for (let i = 0; i < size; i++) {
    augmented.push((a[i] ?? []).concat(b[i] ?? 0));
  }

  for (let column = 0; column < size; column++) {
    let pivot = column;
    for (let row = column + 1; row < size; row++) {
      if (
        Math.abs(augmented[row]?.[column] ?? 0) >
        Math.abs(augmented[pivot]?.[column] ?? 0)
      ) {
        pivot = row;
      }
    }
    const pivotRow = augmented[pivot];
    const currentRow = augmented[column];
    if (!pivotRow || !currentRow) return null;
    augmented[pivot] = currentRow;
    augmented[column] = pivotRow;
    const pivotValue = pivotRow[column] ?? 0;
    if (!Number.isFinite(pivotValue) || pivotValue === 0) return null;

    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const target = augmented[row];
      if (!target) return null;
      const factor = (target[column] ?? 0) / pivotValue;
      if (factor === 0) continue;
      for (let k = column; k <= size; k++) {
        target[k] = (target[k] ?? 0) - factor * (pivotRow[k] ?? 0);
      }
    }
  }

  const solution = new Array<number>(size).fill(0);
  for (let i = 0; i < size; i++) {
    const row = augmented[i];
    if (!row) return null;
    const value = (row[size] ?? 0) / (row[i] ?? 1);
    if (!Number.isFinite(value)) return null;
    solution[i] = value;
  }
  return solution;
}
