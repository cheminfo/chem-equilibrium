# chem-equilibrium — complete algorithmic description

Source of truth: `/Users/lpatiny/git/cheminfo/chem-equilibrium/src/`. All line references are to the files as they exist on branch `update-project`. Every numerical claim marked **[verified]** was reproduced by running the code.

---

## 0. Architecture in one paragraph

The package is a classical **Morel & Morgan / MINEQL-style speciation solver**: a "tableau" of independent *components*, a set of *formed species* each defined by a formation constant and a row of stoichiometric coefficients, and a Newton–Raphson iteration on the free component concentrations in log space. Three layers stack on top of each other:

| Layer | File | Role |
|---|---|---|
| `Equation` | `src/core/Equation.js` | one database row: `{formed, components, pK, type}`; solvent elimination |
| `EquationSet` | `src/core/EquationSet.js` | a set of equations; **normalization** (rewriting every species in terms of terminal components), transitive closure, and conversion to a numeric `model` |
| `Helper` | `src/helpers/Helper.js` | database loading, solvent filtering, species bookkeeping, `getModel()` |
| `Equilibrium` | `src/core/Equilibrium.js` | model → matrices; elimination of fixed components; `solve()` / `solveRobust()` |
| `newtonRaphton` | `src/core/NewtonRaphton.js` | the actual numerical solver (note the misspelling — it is the exported name) |
| `Serie` | `src/helpers/Serie.js` | titrations and parameter sweeps by continuation |

Public API: `src/index.js` exports exactly `Equilibrium`, `Helper`, `Serie`.

---

## 1. Mathematical formulation

### 1.1 Components vs formed species

The system is described by `Nc` **components** — a chemically independent basis (e.g. `H+`, `CO3--`, `Ag+`) — and `Ns` **formed species** built from them. Each formed species `l` has a stoichiometric row `a_·l` and a formation constant `β_l`:

```
Σ_i a_il · C_i  ⇌  S_l          β_l = [S_l] / Π_i [C_i]^{a_il}
```

so that, explicitly,

```
[S_l] = β_l · Π_{i=1}^{Nc} [C_i]^{a_il}                    (law of mass action)   (1)
```

Crucially, **the formed species are never unknowns**. They are *explicit functions* of the components through (1). This is the dimensional reduction that makes the whole thing tractable: a system with 4 components and 30 species is a 4-dimensional root-finding problem, not a 34-dimensional one.

Internally the solver treats the components themselves as species too. In `newtonRaphton` the species vector has `nspec = beta.length` entries whose **first `ncomp` columns are the components themselves**, with an identity stoichiometric block and `β = 1` (`Equilibrium.js:108-122`):

```js
let beta = new Matrix(1, nSpecSolution + nComp).fill(1);            // Equilibrium.js:108
beta.setSubMatrix([formedSpeciesSolution.map((c) => c.beta)], 0, nComp);
let matrix = new Matrix(nComp, nSpecSolution + nComp);              // Equilibrium.js:120
matrix.setSubMatrix(Matrix.identity(model.components.length), 0, 0);
```

So (1) applied to column `l < ncomp` returns `1 · [C_l]^1 = [C_l]`, and the mass balance below can be written as a single sum.

### 1.2 Mass balance (the equations actually solved)

For every component `i`:

```
T_i  =  Σ_{l=0}^{nspec-1} a_il · [S_l]  +  Σ_{p ∈ solids} s_ip · n_p            (2)
     =  Σ_l a_il · β_l · Π_k [C_k]^{a_kl}  +  Σ_p s_ip · n_p
```

`T_i` is the *analytical total* of component `i` (`cTotal`), `s_ip` the stoichiometric coefficient of component `i` in solid `p`, and `n_p` the amount of solid `p` (a "concentration" in the same units — the code never distinguishes).

Code: dissolved part `NewtonRaphton.js:130-147`, solid part `NewtonRaphton.js:150-157`.

```js
cSpec = Matrix.multiply(                                   // NewtonRaphton.js:130-139
  [cMatrix.transpose().repeat({rows: 1, columns: nspec}).powM(modelMatrix).product('column')],
  [beta],
);                                                          // → [S_l] = β_l Π_i c_i^{a_il}

const cTotCalc = new Matrix([                               // NewtonRaphton.js:142-147
  Matrix.multiply(cSpec.repeat({rows: ncomp, columns: 1}), modelMatrix).sum('row'),
]);                                                         // → Σ_l a_il [S_l]
```

**[verified]** `Matrix.multiply` in ml-matrix 6 is the *element-wise* Hadamard product, not `mmul`; `powM` is element-wise power; `product('column')` returns the per-column product as a plain array.

### 1.3 The `pK` ↔ `β` convention

This is the single most confusing point of the package and must be stated precisely on the page:

> **In this database, `pK` always means `log₁₀` of the *formation* constant of `formed` from `components`. Never `−log₁₀`.** `EquationSet.getModel()` computes `beta: 10 ** eq.pK` (`EquationSet.js:217`) with no sign flip, for every reaction type.

The naming works out per type by coincidence:

| type | DB row | meaning of `pK` | β = 10^pK |
|---|---|---|---|
| `acidoBasic` | `HA ← A⁻ + H⁺`, pK = 4.7 | pK*a* | `β = 10^4.7 = 1/Ka` ✔ because `[HA] = β[A⁻][H⁺]` and `Ka = [A⁻][H⁺]/[HA] = 1/β` |
| `precipitation` | `AgCl ← Ag⁺ + Cl⁻`, pK = 9.74 | p*K*s | `β = 10^9.74 = 1/Ksp` |
| `complexation` | `AgCl₂⁻ ← Ag⁺ + 2 Cl⁻`, pK = 5.26 | **+log β₂** (not a "p" anything) | `β = 10^5.26` |

**[verified] on the bundled database** (`data/data.json`, 125 rows: 39 `acidoBasic`, 47 `complexation`, 39 `precipitation`; raw pK range −7 … 71.8):

```
AgCl      {Ag+:1, Cl-:1}    pK 9.74   → β = 5.495e9    → Ksp = 1.82e-10  (lit. 1.77e-10)
AgCl2-    {Ag+:1, Cl-:2}    pK 5.26   → β = 1.820e5
H2O       {OH-:1, H+:1}     pK 14     → β = 1e14 = 1/Kw
```

`Equilibrium._processModel` then inverts *only the solids* back to a dissociation constant, because that is what the solver's saturation test wants (`Equilibrium.js:183-184`):

```js
// newtonRaphton uses the dissociaton Ksp, not the formation Ksp
solidBeta.pow(-1);
```

So the contract is: **`model.formedSpecies[].beta` is always a formation constant (1/Ksp for a solid); `newtonRaphton`'s `solidKsp` argument is a dissociation Ksp.** Both examples confirm it — `examples/Equilibrium/non-soluble/Fe-Cu-pH.js:29` writes `beta: 1 / 1584893192.46` = 10⁻⁹·² for `Cu(OH)2`, which **[verified]** is exactly the normalized DB value `pK = -9.2`.

### 1.4 Sign convention of stoichiometric coefficients

- **positive `a_il`**: the component is *consumed* to build the species. `HCO3-` = `{CO3--: 1, H+: 1}`.
- **negative `a_il`**: the component is *released* — equivalently the species is formed by *removing* it. `OH-` = `{H+: -1}` with β = 10⁻¹⁴, i.e. `[OH⁻] = Kw/[H⁺]`.
- the **solvent has unit activity and is eliminated entirely** — it appears in no model.

**[verified] normalized values from the shipped DB** (after `getNormalized('H2O')`):

```
OH-        {H+: -1}                  β = 1e-14
HCO3-      {CO3--: 1, H+: 1}          pK 10.33
H2CO3      {CO3--: 1, H+: 2}          pK 16.63   (= 10.33 + 6.30)
Cu(OH)2    {Cu++: 1, H+: -2}          pK -9.20   solid
Fe(OH)3    {Fe+++: 1, H+: -3}         pK -3.45   solid
AgOH       {Ag+: 1, H+: -1}           pK -6.28   solid   (= 7.72 - 14)
Ca(OH)2    {Ca++: 1, H+: -2}          pK -22.70  solid
Ni(NH3)6++ {Ni++: 1, NH2-: 6, H+: 6}  pK 146.30            ← β = 2.0e146
Zn(OH)4--  {Zn++: 1, H+: -4}          pK -40.55            ← β = 2.8e-41
```

Those last two numbers matter for the pitfalls section: the model spans **187 decades of β**.

---

## 2. Building the model from the database

### 2.1 Solvent elimination — `Equation.withSolvent(solvent)` (`Equation.js:62-92`)

Three cases:

1. **`formed === solvent`** (`Equation.js:67-75`) — the equation is *inverted*. The **first component key** (insertion order!) becomes the new `formed`, the remaining components are negated, and `pK ← −pK`:
   ```
   H2O ← OH⁻ + H⁺   (pK 14)      ⟹     OH⁻ ← −H⁺   (pK −14)
   ```
   The solvent disappears from the system, and one of its constituents becomes a formed species. This is exactly how `OH-` gets into every aqueous model.
2. **solvent is a component** (`Equation.js:76-86`) — it is deleted from `components` (unit activity), pK unchanged.
3. **solvent absent** — `this.clone()`.

Validation: `type` must be one of `acidoBasic | precipitation | complexation` (`Equation.js:3`, `:14`); `formed` a string, `pK` a number, `components` a non-empty plain object (`Equation.js:8-20`).

### 2.2 Normalization — `EquationSet.getNormalized(solvent)` (`EquationSet.js:138-161` → `normalize()` `:279-309`)

> "In a normalized set, formed species can be found in any of the components of the equation set" (`EquationSet.js:139-140`) — i.e. **after normalization no equation references a species that is itself formed by another equation**. The components that survive are the *terminal* ones, the basis.

Algorithm:

1. `isIndependent(equations, idx)` (`:311-318`) — true if none of the equation's component keys is the `formed` of another equation. Independent equations are copied verbatim.
2. Every dependent equation records `needs[i]` = the indices of the equations that form each of its components (`:289-292`); `-1` marks a terminal component.
3. Up to **10 passes** (`:297`), any equation whose needs are all resolved is rewritten by `fillLine` → `fillRec` (`:327-355`).
4. If anything is still undefined → `throw new Error('There may be a circular dependency in the equations')` (`:305-307`).

`fillRec(equations, eq, eqToFill, n)` is a depth-first substitution with a running multiplier:

```js
const nn = n * components[key];
const rep = equations.find((e) => e.formed === keys[j]);
if (rep) fillRec(equations, rep, eqToFill, nn);           // substitute recursively
else componentsToFill[keys[j]] = (componentsToFill[keys[j]] || 0) + nn;
eqToFill.pK = (eqToFill.pK || 0) + n * eq.pK;             // EquationSet.js:353-354
```

The stoichiometry multiplies and **the log-constants add, weighted by the multiplier**:

```
log β(overall) = log β(self) + Σ_k ν_k · log β(k-th substituted reaction)
```

Worked, matching `src/core/__tests__/EquationSet.test.js:26-37`: `A ← 2B` (pK 2) and `B ← C + D` (pK 3) normalize to `A ← 2C + 2D` with pK = 2 + 2·3 = **8**. And from the real DB: `H2CO3 ← HCO3⁻ + H⁺` (6.30) on top of `HCO3⁻ ← CO3²⁻ + H⁺` (10.33) gives `H2CO3 ← CO3²⁻ + 2H⁺`, pK = 16.63 **[verified]**.

**Key detail for the page:** the *hash keys are preserved through normalization* (`EquationSet.js:145,153`), and the key is `btoa(formed)` of the **original** formed species (`getHash`, `:357-359`). So after normalizing water, the `OH-` equation is stored under the key `btoa('H2O')` — `norm.get('OH-', true)` returns `undefined` **[verified]**, and `helper.disableEquation('OH-')` does nothing; you must disable `'H2O'`.

### 2.3 Transitive closure — `EquationSet.getSubset(species)` (`EquationSet.js:224-276`)

Two directions, this is what the README's "walks the database to pull in every specie reachable" means.

**Phase 1 — downward (recursive `f`, `:231-243`).** For every equation whose `formed` is in the current species list, add the equation, add its components to the set, and recurse on those components. Turning `H2CO3` into `HCO3⁻` into `CO3²⁻ + H⁺`. Because `Helper`'s constructor always calls `addSpecie(options.solvent)` (`Helper.js:21`), `'H2O'` is always in the seed set, so the water equation is always picked up and `OH⁻`/`H⁺` always enter the basis.

**Phase 2 — upward (`:251-266`).** Repeatedly add every equation *all* of whose components are already in the set. With `CO3²⁻` and `H⁺` present, `HCO3⁻` gets added; then `H2CO3`; then every carbonate salt whose cation is present. This is the step that produces species the user never declared.

Both phases are guarded by a `passes` counter capped at 10 with `throw new Error('You might have a circular dependency in your equations')`. See pitfall **P11** — the guard is broken.

### 2.4 Totals distribution — `EquationSet.getModel(totals, all)` (`EquationSet.js:178-222`)

```js
for (const key in totals) {
  const total = totals[key] || 0;
  if (components.includes(key)) totalComp[key] += total;      // direct
  else {                                                       // a formed specie was put in the flask
    const eq = subsetArr.find((e) => e.formed === key);
    if (eq) for (const c of Object.keys(eq.components))
      totalComp[c] += eq.components[c] * total;                // EquationSet.js:199
  }
}
```

Adding 1 mol of `HCO3⁻` is recorded as 1 mol of `CO3²⁻` **and** 1 mol of `H⁺`. Adding 0.05 mol of `OH⁻` is recorded as **−0.05 mol of `H⁺`** (because `OH⁻ = {H⁺: −1}`) — this is how `examples/Helper/non-soluble/Fe3-Cu2-OH.js:9` raises the pH. Negative totals are legal and physically meaningful (proton deficit).

Output shape (`EquationSet.js:205-221`):

```js
{
  volume: 1,                                   // ← never read by Equilibrium; see pitfall P14
  components:    [{ label, total }, …],
  formedSpecies: [{ solid: eq.type === 'precipitation', label, beta: 10 ** eq.pK,
                    components: [a_1l, a_2l, …] }, …],   // aligned to the components array order
}
```

The components array order is `Array.from(Set)` over the enabled equations' component keys — deterministic, database-order dependent, and *the* index convention that every `formedSpecies.components` array must follow.

### 2.5 `Helper` (`src/helpers/Helper.js`)

- **`processDB(db, options)`** (`:124-144`): if `pK` is not a number **or** the solvent is not `H2O`, look up `db[i].pK[solvent]`; if absent, drop the equation. Consequence: a numeric `pK` is implicitly a water-only value, and any equation lacking a pK for the chosen solvent silently disappears. `src/__tests__/data/equations.js:1-34` (`multiSolvent`) exercises exactly this.
- **`species`**: a `{label → amount}` map. `addSpecie(label, total = 0)` *accumulates* (`:85-89`); `setTotal` *replaces* and removes the label from `atEquilibrium` (`:97-100`); `setAtEquilibrium(label, value)` replaces and adds the label to the `atEquilibrium` set (`:102-105`).
- **`getModel()`** (`:62-73`): `getSubset(Object.keys(species))` → `getNormalized(solvent)` → `getModel(species, true)`, then converts every component that is in `this.atEquilibrium` from `total` to `atEquilibrium`:
  ```js
  if (this.atEquilibrium.has(c.label)) { c.atEquilibrium = this.species[c.label]; delete c.total; }
  ```
- **`getEquilibrium()`** (`:75-77`) forwards **all** helper options to `Equilibrium`, so `volume`, `tolerance`, `solidTolerance`, `maxIterations`, `random` and `robustMaxTries` all flow through from `Serie`.
- **`disableEquation(formedSpecie)`** (`:111-113`) → `eqSet.disableEquation(key, true)` → `_disabledKeys.add(btoa(label))`. A disabled equation is skipped by `getSpecies`/`getComponents`/`getEquations`/`getModel`, so **the species vanishes from the model entirely** — it is not re-exposed as a free component, because normalization has already eliminated it from every other equation's component list. `src/helpers/__tests__/Helper.test.js:93-104` shows that disabling `A` removes both `A` and `B` from `getSpecies()`.

---

## 3. Model → matrices: `Equilibrium._processModel` (`Equilibrium.js:91-227`)

### 3.1 Fixed ("atEquilibrium") components — how the system is reduced

A component declared `{label, atEquilibrium: v}` has its concentration *imposed*. Since `[C_i]` is then a constant, it can be folded into every formation constant and the whole row/column removed:

```
β'_l = β_l · v^{a_il}
```

Code, for dissolved species (`Equilibrium.js:133-146`) and again verbatim for solids (`:164-177`):

```js
const atEq = model.components[i].atEquilibrium;
if (atEq) {
  const m = new Matrix(1, nSpecSolution + nComp).fill(atEq);
  m.powM([matrix.getRow(i)]);      // m_l = atEq ^ a_il
  beta.multiply(m);                // β_l ← β_l · atEq^{a_il}
} else {
  rows.push(i);                    // keep this component as an unknown
}
```

then the rows and columns of the fixed components are dropped (`:149-151`, `:180-182`):

```js
let columns = rows.concat(getRange(nComp, nComp + nSpecSolution - 1));
matrix = matrix.selection(rows, columns);
beta   = beta.selection([0], columns);
```

This is the classic "pH-buffered" reduction: setting `H+` at equilibrium turns an acid/base system into a *linear* problem in the remaining components (every species becomes `β'·[C]^1`), which is why the phosphoric-acid sweep in `src/core/__tests__/Equilibrium.test.js:42-91` converges in a handful of iterations at every pH.

The fixed values are **not** unknowns and never enter Newton. They are re-injected verbatim into the result at the end (`_processResult`, `Equilibrium.js:314-316`), which is why `expect(solution['H+']).toBe(0.01)` is an exact equality in the tests (`Equilibrium.test.js:36`).

### 3.2 Volume

`total` and `atEquilibrium` are documented as *amounts*; concentrations are obtained by dividing by `options.volume` (`Equilibrium.js:200,203`):

```js
cFixed.push(component.atEquilibrium / this.options.volume);   // :200
cTotal.push(component.total / this.options.volume);            // :203
```

See pitfall **P1** — the β folding at `:139` and `:170` uses the *undivided* `atEq`, so the two are inconsistent whenever `volume ≠ 1`.

### 3.3 The processed model object (`Equilibrium.js:213-226`)

```js
{
  model:      matrix.to2DArray(),        // (Nfree × (Nfree + Nsol_dissolved))  stoichiometry, identity block first
  beta:       beta.to1DArray(),          // 1 for components, β'_l for dissolved species
  cTotal,                                // totals of the FREE components only, /volume
  cFixed,                                // imposed concentrations, /volume
  specLabels,                            // [free components…, dissolved species…, solids…]  ← output order
  compLabels, fixedLabels, specSolidLabels, specSolutionLabels,
  nFixed: nComp - matrix.rows,
  solidModel: solidMatrix && solidMatrix.to2DArray(),   // (Nfree × Nsolid)
  solidBeta:  solidBeta  && solidBeta.to1DArray(),      // Ksp (dissociation) after .pow(-1)
}
```

`specLabels` is assembled at `:209-211` in exactly the order the solver returns values in, and `_processResult` (`:307-319`) zips them back into `{label: concentration}`.

Validation (`:330-377`): unique labels across components *and* formed species; every component has a numeric `total` or `atEquilibrium`; every formed species has a numeric `beta` and a `components` array of length `model.components.length`.

---

## 4. The Newton–Raphson core (`src/core/NewtonRaphton.js`)

### 4.1 Signature and defaults

```js
newtonRaphton(model, beta, cTotal, c, solidModel, solidKsp, solidC, options)   // :27-36
const defaultOptions = { tolerance: 1e-15, solidTolerance: 1e-5, maxIterations: 99 };  // :6-10
```

Argument consistency is checked at `:48-57` (`throw new Error('Invalid arguments')`). Missing solid arguments are normalized to empty (`:41-43`). Debug tracing via `debug('core:newton-raphton')` (`:1-4`, `:179`, `:243`).

### 4.2 What is solved for

**The unknown vector is**

```
x = ( ln[C_1], …, ln[C_Nc],  n_{p1}, …, n_{pk} )
```

- the `ncomp` **free component concentrations, in logarithmic space**,
- the amounts of the **currently selected subset of solids**, in *linear* space.

`njstar = ncomp + nSolidPicked` (`:127`) changes from iteration to iteration.

The log-space part is not stored as logs — `cMatrix` always holds linear `c` — but the Jacobian is `∂/∂ln c` and the step is converted back with `Δc = c·Δln c` at the end (see §4.5). Dissolved formed species are never unknowns.

### 4.3 Residual

Component block (`:160`):

```
d_i = T_i − T_i^calc  =  T_i − ( Σ_l a_il [S_l] + Σ_p s_ip n_p )
```

Solid block, for each *picked* solid `p` (`:163`):

```
dK_p = log2(Ksp_p) − log2(IAP_p)      where IAP_p = Π_i [C_i]^{s_ip}
```

```js
lnSolidBeta = new Matrix([solidKsp.map(Math.log2)]);           // :68
lnKsp[j] = Math.log2(Ksp[j]);                                  // :112
const dK = Matrix.subtract(lnSolidBeta, [lnKsp]).selection([0], solidIndices);   // :163
```

`Ksp` in the code is a **misnomer**: it is the *ion activity product* IAP computed from the current iterate (`:92-96`); `solidKsp` is the real solubility product. The two are stacked into `dAll` (1 × njstar) at `:168-170`.

A second, *linear* difference is also kept (`:167`):

```js
dkOrig = Matrix.subtract([solidKsp], [Ksp]);      // Ksp_p − IAP_p, full length nsolid
```

### 4.4 Jacobian

The code builds the **symmetric saddle-point matrix** `J*` (the comment at `:183` says "Jstar is symetric and easier to inverse"):

```
      ┌                     ┐
 J* = │   A       S         │      A ∈ ℝ^{Nc×Nc},  S ∈ ℝ^{Nc×k}
      │   Sᵀ      0         │
      └                     ┘
```

**Block A** (`:192-199`) — the derivative of the calculated totals w.r.t. the *logarithms* of the components:

```
A_jk = ∂T_j^calc / ∂ln[C_k] = Σ_l a_jl · a_kl · [S_l]
```

```js
for (let j = 0; j < ncomp; j++)
  for (let k = j; k < ncomp; k++)
    for (let l = 0; l < nspec; l++) {
      jstar[j][k] += modelRows[k][l] * modelRows[j][l] * cSpecRow[l];
      jstar[k][j] = jstar[j][k];
    }
```

(The symmetric write sits inside the innermost loop — correct, just `O(Nc²·Ns)` redundant assignments.)

**Block S** (`:202-208`) — `∂T_j/∂n_p = s_jp`, and the mirrored `Sᵀ` block which is the derivative of the saturation constraint w.r.t. `ln[C_j]`:

```js
jstar[j][jk]  = solidModelPicked.get(j, k);
jstar[jk][j]  = solidModelPicked.get(j, k);
```

**Bottom-right block is exactly zero** — the saturation constraint `IAP_p = Ksp_p` does not depend on how much solid is present. That is the whole physics of a pure solid phase, and it is also why the matrix is *indefinite* rather than positive definite.

### 4.5 Step, back-transform, damping

```js
const diag = Matrix.identity(njstar).setSubMatrix(Matrix.diag(cMatrix.getRow(0)), 0, 0);  // :211-215
let deltaC = dAll.mmul(inverse(new Matrix(jstar))).mmul(diag);                            // :216
```

Because `J*` is symmetric, the row-vector form `dᵀ J*⁻¹` equals `J*⁻¹ d`. The right multiplication by `diag(c_1…c_Nc, 1, …, 1)` performs the back-transform:

```
Δc_i = c_i · Δln c_i      (components)
Δn_p = Δn_p               (solids, already linear)
```

Then the **positivity-preserving step halving** (`:218-231`):

```js
allC.setSubMatrix(cMatrix, 0, 0);
if (nSolidPicked) allC.setSubMatrix(solidCPicked, 0, ncomp);
allC.add(deltaC);
while (checkNeg(allC)) {                    // :227
  deltaC = deltaC.multiply(0.5);
  allC.subtract(deltaC);
  if (checkEpsilon(options.tolerance, deltaC)) break;
}
```

The geometric back-off produces `c + Δ/2ᵏ`: start `c+Δ`; if any entry is non-positive, halve `Δ` and subtract, giving `c+Δ/2`, then `c+Δ/4`, … `checkNeg` (`:275-280`) returns true for **`≤ 0`**, so an entry of exactly zero also triggers halving. The loop bails out when `|Δ| < tolerance` in every coordinate — and at that point `allC` may still hold a non-positive value.

Commit (`:233-239`):

```js
for (let j = 0; j < cMatrix.columns; j++) cMatrix.set(0, j, allC.get(0, j));   // no clamping!
for (let j = 0; j < nSolidPicked; j++)
  solidCMatrix.set(0, solidIndices[j], Math.max(allC.get(0, ncomp + j), 0));   // solids clamped at 0
```

Solids that were not picked keep their previous value (necessarily 0).

Note the algorithm would preserve positivity automatically if it used `c·exp(Δln c)`; using `c·(1+Δln c)` is what makes the halving loop necessary. This is the standard trade-off in this family of codes and is worth stating explicitly on the page.

### 4.6 Convergence criteria

```js
if (checkEpsilon(options.tolerance, d) &&                                    // :176
    checkSolid(options.solidTolerance, solidCMatrix, dkOrig, nsolid)) {      // :177
  debug(`solution converged in ${iteration} iterations`);
  return toResult(cSpec, solidCMatrix, solidC, nsolid);
}
```

- `checkEpsilon(tolerance, d)` (`:255-260`): **every** component mass-balance residual `|T_i − T_i^calc| < tolerance`, default **1e-15, absolute**. Note it tests `d` only — *not* `dAll`, so the log-space solid residual is not part of this test.
- `checkSolid(solidTolerance, solidC, dk, nsolid)` (`:262-272`): for every solid whose amount is **strictly > 0**, `|Ksp_p − IAP_p| < solidTolerance`, default **1e-5, absolute and linear** (not logarithmic). Solids at exactly 0 are skipped (`:265`). If a solid is present but `dk` is missing it throws `'Missing solubility product difference'` (`:266-268`) — defensive; unreachable in practice, since a solid with `n_p > 0` is always picked (`:102-104`) and therefore always has `dkOrig` computed that same iteration.

Non-convergence (`:242-245`): after `maxIterations = 99` sweeps, `debug('did not converge')` and **`return null`**. The trailing `return toResult(...)` at `:247` is dead code — the loop can only exit by returning or by exhausting the counter.

Result assembly (`:250-252`):

```js
cSpec.to1DArray().concat(nsolid ? solidCMatrix.to1DArray() : solidC)
```

so the returned array is `[free components…, dissolved species…, all solids…]`, matching `specLabels`.

### 4.7 A guard on `cTotal`

```js
for (let i = 0; i < cTotal.length; i++) if (cTotal[i] === 0) cTotal[i] = options.tolerance;   // :73-75
```

A total of exactly zero is nudged to `tolerance` to avoid degenerate rows. This **mutates the caller's array in place** — `this._model.cTotal` is permanently altered after the first `solve()`.

---

## 5. Precipitation / solid handling — why this is the hard part

### 5.1 The physics: a complementarity problem

For each candidate solid `p`, equilibrium requires *one of two mutually exclusive* conditions:

```
  n_p > 0   and   IAP_p = Ksp_p       (phase present, solution saturated)
  n_p = 0   and   IAP_p ≤ Ksp_p       (phase absent, solution undersaturated)
```

i.e. `n_p ≥ 0`, `Ksp_p − IAP_p ≥ 0`, `n_p·(Ksp_p − IAP_p) = 0` — a **linear complementarity / active-set problem grafted onto a nonlinear system**. With `Ns` candidate solids there are `2^{Ns}` possible phase assemblages and the answer is a *discrete* choice. That discreteness is what makes precipitation qualitatively harder than dissolved speciation: the residual function is only piecewise smooth, and Newton's quadratic convergence is lost every time the active set flips.

### 5.2 What the code actually does

**It does not enumerate subsets.** It re-decides the active set from scratch **at the top of every iteration** (`NewtonRaphton.js:91-114`) from the current iterate:

```js
Ksp = cMatrix.transpose().repeat({rows:1, columns:nsolid}).powM(solidModelMatrix).product('column');
for (let idx = 0; idx < Ksp.length; idx++) {
  const k = Ksp[idx];
  if (k > solidKsp[idx])                                    solidIndices.push(idx);  // supersaturated → must precipitate
  else if (solidCMatrix.get(0, idx) > 0)                    solidIndices.push(idx);  // already present → keep in basis
  else if (Math.abs(k - solidKsp[idx]) < options.tolerance)  solidIndices.push(idx);  // exactly at saturation
}
```

Three admission rules; **no removal rule**. A solid leaves the basis only *implicitly*: its amount is clamped to 0 by `Math.max(value, 0)` (`:238`), and on the next sweep, if it is also undersaturated, none of the three tests fires and it is silently dropped. The number of unknowns, the Jacobian dimension `njstar`, and the residual vector therefore change shape every iteration.

### 5.3 Why it is fragile

1. **No Gibbs-phase-rule check.** At most `Nc` solids can coexist. Nothing prevents `nSolidPicked > ncomp`, which makes the `[[A,S],[Sᵀ,0]]` block structure necessarily rank-deficient.
2. **Linearly dependent solids ⇒ exactly singular Jacobian ⇒ an exception, not a `null`.** **[verified]**: two solids with identical stoichiometry rows make `inverse()` throw `LU matrix is singular`, which propagates out of `newtonRaphton`, out of `solve()`/`solveRobust()` and out of `Serie` uncaught.
   ```js
   newtonRaphton([[1,0],[0,1]], [1,1], [1,1], [0.1,0.1],
                 [[1,1],[1,1]], [1.77e-10, 1.0e-10], [0,0]);   // → throws "LU matrix is singular"
   ```
3. **Cycling.** A solid may be admitted (supersaturated), pushed negative by the Newton step, clamped to 0, found undersaturated, dropped, then found supersaturated again. There is no anti-cycling rule, no active-set history, no line search on a merit function — only the halving loop, which damps *all* coordinates including the well-behaved dissolved ones.
4. **A zero-amount solid pins the whole step.** `checkNeg` treats `0` as negative (`:275-279`). A solid admitted because it is supersaturated but whose Newton step `Δn_p ≤ 0` starts at `n_p = 0`, so `allC` contains a non-positive entry and the *entire* step (components included) is halved until `|Δ| < 1e-15`. That is a stall, not a solution.
5. **Two different, inconsistent measures of "saturated".** The Newton residual uses `log2(Ksp) − log2(IAP)`; the convergence test uses the *linear* `Ksp − IAP` against an *absolute* tolerance of 1e-5. See **P3** — this is a demonstrated failure mode.
6. **`solveRobust` starts with every solid in the basis.** `Equilibrium.js:264-265` draws random *positive* solid amounts, so rule 2 (`solidC > 0`) admits all of them on iteration 0. Likewise, `setInitial` maps any `0` to `1e-15` (`Equilibrium.js:295`), so a warm start from a solution with no precipitate also re-admits every solid.

### 5.4 The recommended manual strategy (from the examples)

`examples/Equilibrium/non-soluble/FeCO3-simple.js:37-47` shows the two-stage trick that works when the automatic active-set search struggles: **solve the fully dissolved system first, then feed its component concentrations as the initial guess for the run with solids.**

```js
var result   = newtonRaphton(model, beta, cTotal, c);              // no solids at all
var initialC = result.slice(0, c.length);                          // just the components
result = newtonRaphton(model, beta, cTotal, initialC, solidModel, solidBeta, solidC);
```

`examples/Equilibrium/non-soluble/AgCl.js` is the minimal single-solid case; `Ca-Fe-CO3.js` is a 4-component / 4-solid case (`CaCO3`, `Ca(OH)2`, `FeCO3`, `Fe(OH)2`) that shows the intended layout of `solidModel` — one row per component, one column per solid, with negative `H+` coefficients for the hydroxides.

---

## 6. Initial guesses, `solve()` and `solveRobust()`

### 6.1 The random draw — `util/random.js:7-16`

```js
export function logarithmic(random, len) {
  if (len === undefined) return random() ** 10;
  …values[i] = random() ** 10;
}
```

`u¹⁰` for `u ~ U[0,1)` gives `log₁₀ x = 10·log₁₀ u`, i.e. an exponential distribution over decades with mean ≈ 10/ln10 ≈ **4.34 decades below 1** (median ≈ 10⁻³). It is a crude log-uniform-ish prior over concentrations, bounded above by 1. Smallest attainable non-zero value ≈ (2⁻⁵³)¹⁰ ≈ 1e-159; **exactly 0 is attainable** only if `random()` returns exactly 0 (permitted by the `Math.random` spec).

### 6.2 `_getInitial()` (`Equilibrium.js:49-82`)

Walks the keys of `this._initial`; a key is looked up in `compLabels`, then in `specSolidLabels`. **Keys matching neither (i.e. dissolved formed species) are silently ignored** — correct, since they are not unknowns. Every unfilled slot is drawn with `logarithmic(this.options.random)`.

### 6.3 `setInitial(init)` (`Equilibrium.js:290-298`)

Copies the object and replaces every value that is exactly `0` with `1e-15` — essential, because a component at exactly 0 makes `c^{negative}` infinite and `log2(IAP)` = −∞.

### 6.4 `solve()` (`:235-251`)

One `newtonRaphton` call from `_getInitial()`. On success, if `options.autoInitial` (default `true`), the whole result is fed back through `setInitial` so the *next* `solve()` warm-starts from it. Returns `null` on non-convergence, `_processResult(null) → null`.

### 6.5 `solveRobust()` (`:260-283`)

```js
for (let i = 0; i < this.options.robustMaxTries; i++) {      // default 10
  const initial = {
    components: logarithmic(this.options.random, model.compLabels.length),
    solids:     logarithmic(this.options.random, model.specSolidLabels.length),
  };
  const cSpec = newtonRaphton(…);
  if (cSpec) return this._processResult(cSpec);
}
return null;
```

**Pure multi-start with no memory**: it ignores `setInitial` entirely, never calls `setInitial` on success (so `autoInitial` does not apply), and does not lower the tolerance or increase `maxIterations` between tries — only the starting point changes. `robustMaxTries` defaults to **10** in the code (`Equilibrium.js:8`) although the JSDoc at `:33` claims 15.

There is no fallback ordering, no bisection on a continuation parameter, and no `try/catch` — a singular Jacobian on the first try aborts all remaining tries.

---

## 7. `Serie`: continuation over a parameter

Default options (`Serie.js:1-7`): `{ chunks: 200, log: false, from: 0, to: 1, isFixed: false }`. Both methods `clone()` the helper so the caller's helper is untouched, and `setOptions(options)` so that solver options (`tolerance`, `solidTolerance`, `maxIterations`, `random`) reach `Equilibrium` through `Helper.getEquilibrium()`.

### 7.1 The continuation strategy (both methods, `Serie.js:51-56` and `:115-119`)

```js
if (sol) { eq.setInitial(sol); sol = eq.solve(); }   // warm start: one Newton run
else      { sol = eq.solveRobust(); }                // cold start: up to robustMaxTries random restarts
```

Point 0 is solved cold. Every subsequent point reuses the previous solution as the starting guess — the classic homotopy/continuation argument: for a small enough parameter step the previous root is inside the basin of attraction of the new one, so a single Newton run suffices. **If a point fails (`sol === null`), `sol` stays `null` and the next point automatically falls back to `solveRobust()`** — the series self-heals rather than aborting. Failures are counted in `errorCount` and the point is simply omitted from the output arrays.

### 7.2 `getTitration(options)` (`Serie.js:14-82`)

```js
helper.resetSpecies();                                    // :17  ← discards whatever was on the helper
const solQty = options.solution.concentration * options.solution.volume;   // mol of analyte
helper.addSpecie(options.solution.type);                  // :39
helper.addSpecie(options.titrationSolution.type);         // :40

for (let i = 0; i <= chunks; i++) {                       // chunks + 1 points
  const vol      = titrVolStart + (titrVolStop - titrVolStart) * (i / chunks);
  const totalVol = vol + solVolume;                       // :44  ← dilution
  const titrQty  = vol * titrConc;                        // :45  ← mol of titrant added
  helper.setTotal(options.titrationSolution.type, titrQty);
  helper.setTotal(options.solution.type, solQty);
  helper.setOptions({ volume: totalVol });                // :48  ← Equilibrium divides totals by this
  const eq = helper.getEquilibrium();                     // :49  ← the whole model is rebuilt each point
  …
  ph.push(-Math.log10(sol['H+']));                        // :59
}
```

**Volume/dilution handling**: the loop works entirely in *moles* (`solQty`, `titrQty` are amounts) and hands the current total volume to `Equilibrium`, which converts to concentrations at `Equilibrium.js:200,203`. That is the correct and only place dilution enters.

Output shape (`:74-81`):

```js
{
  xy,          // flat [v0, pH0, v1, pH1, …]  length 2·(number of successful points)
  errorCount,  // number of points where the solver returned null
  solutions,   // array of {label → concentration} objects
  species,     // Object.keys(solutions[0]), or [] if nothing converged
  volumes,     // the successful titrant volumes
  equations,   // helper.getEquations({ filtered: true }) — raw (non-normalized) equations of the subset
}
```

**[verified]** by `src/helpers/__tests__/Serie.test.js:51-82`: 10 chunks → 11 volumes → `xy` of length 22, `species = ['H+','CH3COO-','OH-','CH3CO2H']`, monotone decreasing pH from 8.850027953970796 to 1.476861683532796.

### 7.3 `getSolutions(options)` (`Serie.js:84-133`)

No `resetSpecies()` — it sweeps on top of the helper's existing composition. Validated by `checkOptions` (`:136-146`): `to > from`, `varying` defined.

```js
const val     = options.from + ((to - from) * i) / chunks;
const realVal = log ? 10 ** -val : val;                   // :106  ← `log: true` makes `val` a p-value
if (options.isFixed) helper.setAtEquilibrium(varying, realVal);   // pin at equilibrium
else                 helper.setTotal(varying, realVal);           // set as a total amount
```

So `{varying:'H+', isFixed:true, log:true, from:0, to:14}` is a pH sweep from 0 to 14, with `[H⁺] = 10^{-pH}` imposed. Output (`:127-132`): `{ x, solutions, errorCount, species }` where `x` holds the **p-values** (not `realVal`). Note `getSolutions` never touches `volume`, so totals are interpreted directly as concentrations.

---

## 8. Numerical pitfalls

Ordered roughly by severity. **[verified]** = reproduced by running the code.

### P1 — `atEquilibrium` is not volume-corrected in the β folding **[verified]**

`Equilibrium.js:139` and `:170` fold the **raw** `atEquilibrium` into the formation constants (`m.fill(atEq)`), while `:200` reports `cFixed = atEquilibrium / volume`. With `volume ≠ 1` the returned solution **violates its own mass-action law**:

```
volume 1 : {A-:0.01747, HA:0.98253, H+:0.001}    HA/([H+][A-]) = 5.6234e4  = β  ✔
volume 2 : {A-:0.00874, HA:0.49126, H+:0.0005}   HA/([H+][A-]) = 1.1247e5  = 2β ✘
```

Latent in `Serie.getTitration`, which sets `volume = totalVol` on every point (`Serie.js:48`) — any `atEquilibrium` component in a titration is silently wrong.

### P2 — the Newton residual for solids uses `log2`, the derivation assumes `ln`

`NewtonRaphton.js:68,112` build `dK = log2(Ksp) − log2(IAP)`, but the Jacobian rows `Sᵀ` are `∂(Σ s ln c)/∂ln c`. The correct RHS is the **natural**-log difference; the supplied one is `1/ln2 = 1.4427×` too large. The fixed point is unchanged (`dK = 0 ⟺ ln-residual = 0`) but the step is a *scaled* Newton step on the solid rows — the iteration is inexact, loses quadratic convergence near the solution and systematically overshoots by 44 %, which then interacts with the halving loop.

### P3 — `solidTolerance` is an **absolute, linear** tolerance on `Ksp − IAP` **[verified]**

`checkSolid` (`:262-272`) tests `|Ksp_p − IAP_p| < 1e-5` where `Ksp` spans 60+ decades across the bundled database. Two symmetric failures:

- **Vacuous** for small Ksp: `AgCl` (Ksp 1.8e-10) can never violate `< 1e-5`, so the solid criterion is a no-op and convergence rests entirely on the mass balance.
- **Unsatisfiable** for large Ksp — a genuine, reproducible non-convergence:
  ```js
  const h = new Helper(); h.addSpecie('Ca++', 0.1); h.addSpecie('OH-', 0.1);
  h.getEquilibrium().solveRobust();      // → null, every time
  ```
  `Ca(OH)2` normalizes to `{Ca++:1, H+:-2}`, pK = −22.7, so `Ksp = 5.01e22` and `|Ksp − IAP| < 1e-5` is 18 orders of magnitude beyond double precision. Raising `solidTolerance` to `1e10` makes it converge instantly to a solution whose IAP matches Ksp to **13 significant digits** (5.0118723362722e22 vs 5.011872336272714e22). **The physics was right; the test rejected it.** A relative criterion (`|1 − IAP/Ksp|`) or the already-computed `dK` would fix this.

### P4 — a singular Jacobian throws instead of returning `null` **[verified]**

`inverse(new Matrix(jstar))` (`:216`) uses LU with no SVD fallback and throws `LU matrix is singular`. Triggers: two solids with linearly dependent stoichiometry; more picked solids than components; a component whose every species has zero concentration (a zero row in `A`). Nothing in `solve()`, `solveRobust()` or `Serie` catches it, so one bad point aborts a whole titration.

### P5 — `tolerance` is an absolute residual on the mass balance

`checkEpsilon(1e-15, d)` (`:176`) compares `|T_i − T_i^calc|` to a fixed 1e-15. For `T ~ 1` that is 4–5 ulp — at the edge of what floating point can deliver; for `T ~ 10³` or more it is below the representable resolution of the residual and convergence depends on luck; for `T ≲ 1e-15` it is trivially satisfied and the solver returns after zero real work. Should be `tolerance · max(1, |T_i|)`.

### P6 — the halving loop can commit a non-positive concentration

`:227-231` breaks out when `|Δ| < tolerance`, **even if `allC` still contains an entry ≤ 0**. Components are then written unclamped (`:233-235`). Downstream: `c = 0` gives `0^{negative} = Infinity` in `powM`; `c < 0` gives `NaN` from `Math.log2` (and negative concentrations from even integer exponents). NaN then propagates: `checkNeg(NaN)` is `false`, so the damping never fires again and the run burns all 99 iterations before returning `null`.

### P7 — overflow / underflow across 187 decades of β **[verified]**

Normalized constants in the bundled DB run from `β(Zn(OH)4--) = 2.8e-41` to `β(Ni(NH3)6++) = 2.0e146`. Equation (1) evaluates `β · Π c^a` with up to 12 factors; with the random log-uniform initialization (typical `c ~ 1e-4`, tail down to `1e-159`) a single product can overflow to `Infinity` or underflow to `0`, either of which poisons `cTotCalc`, `d` and the Jacobian. This is the real reason `solveRobust`'s multi-start exists.

### P8 — `newtonRaphton` mutates its `cTotal` argument

`:73-75` writes `tolerance` into the caller's array for zero totals. Since `Equilibrium.solve()` passes `this._model.cTotal` directly, a component whose total is 0 permanently becomes `1e-15` in the cached processed model.

### P9 — `Equation.withSolvent` assumes the promoted component has coefficient 1

`Equation.js:67-75` picks `compKeys[0]` as the new `formed` and **discards its coefficient without dividing the rest by it**:

```js
eq.formed = compKeys[0];
eq.pK = -this._eq.pK;
for (let j = 1; j < compKeys.length; j++) eq.components[compKey] = -this._eq.components[compKey];
```

Correct only when `components[compKeys[0]] === 1` (true for `H2O ← OH⁻ + H⁺`). Also, *which* species is promoted depends on **JSON key insertion order** — a silent coupling between the database file's formatting and the model produced.

### P10 — `processDB` drops equations with `pK === 0`

`Helper.js:130`: `if (db[i].pK[options.solvent])` is a **truthiness** test. A legitimate `pK: 0` (β = 1) for a non-water solvent is falsy and the equation is silently deleted. (No such row exists today — **[verified]** 0 entries with `pK === 0` — but it is a live landmine for any DB extension.) The removal loop is also `O(n²)` via `toRemove.includes(i)` (`:137-141`).

### P11 — the `getSubset` "circular dependency" guard is broken **[verified]**

`EquationSet.js:231-243` increments a **shared invocation counter** (not a recursion depth) and returns only on the exact value 10; the post-check `if (passes === 10) throw` fires only if the counter *stops* at exactly 10.

- A legitimate, perfectly acyclic chain of ≥ 10 equations throws `'You might have a circular dependency in your equations'`. **[verified]**: a linear chain `A1←A2←…` succeeds at n = 9 and throws at n = 10, 11, 12, 15.
- A branched system that overshoots the counter past 10 **does not** throw and silently returns a *truncated* subset — a wrong model, no error. **[verified]** with a two-branch tree.
- A genuinely circular set does **not** throw here at all (`newSet.has(eq)` stops the recursion). **[verified]**: only `normalize()` (`:305-307`) detects cycles.

Phase 2's guard (`:253`, `:268-270`) is outright dead: the `while` exits with `passes === 11`, so `if (passes === 10) throw` can never fire, and chains deeper than 11 upward levels are silently truncated. `let moreAdded = true` at `:229` is also dead (reassigned at `:251`).

Practical impact today: **[verified]** every realistic seed against the shipped database (`Ni(NH3)6++`, `H3PO4`, `Bi2S3`, `Fe(CN)6---`, `Cu(OH)4--`, `CH3COO-`, `CO3--`, `Ag+`) stays under the limit. It becomes a real bug as soon as the database grows.

### P12 — `EquationSet` keys are `btoa(formed)` only

`getHash` (`:357-359`). Consequences: (a) two equations forming the same species silently overwrite each other via `Map.set` (`:31`) — **[verified]** the shipped DB has 125 distinct `formed` labels for 125 rows, so no collision today; (b) `btoa` throws on any label outside Latin-1; (c) after normalization the key still hashes the *pre-inversion* name, so `disableEquation('OH-')` is a no-op and one must call `disableEquation('H2O')` **[verified]**.

### P13 — `Helper.getModel()` ignores `atEquilibrium` on a non-component, and double-counts its total

`Helper.js:66-71` only converts `total → atEquilibrium` for labels that appear in `model.components`. If the user pins a *formed* species (e.g. `setAtEquilibrium('HCO3-', 1e-3)`), the value is first distributed into its components' totals by `EquationSet.getModel` (`:199`) and then never removed — a wrong model with no warning. The `'Y'`-not-in-database case is exercised at `Helper.test.js:208` but only for the no-op path.

### P14 — `model.volume` is ignored

`EquationSet.getModel` emits `volume: 1` (`:206`) and the examples write `volume: 1` into the model literal (`examples/Equilibrium/non-soluble/Ag2CO3.js:4`, `Fe-Cu-pH.js:4`), but `Equilibrium` reads **only** `this.options.volume`. Setting the volume on the model has no effect.

### P15 — `Helper.addSpecie`'s solvent guard is dead code

`Helper.js:82-84` tests `label === this.solvent`, but the property is `this.options.solvent`; `this.solvent` is always `undefined`. The intent (force the solvent's total to 0) never executes; it happens to be harmless because the constructor adds the solvent with total 0.

### P16 — `Helper.clone()` rebuilds the whole database for nothing

`Helper.js:25-32` calls `new Helper()` with no options — reprocessing all 125 rows and building a fresh `EquationSet` — then overwrites all four fields. `Serie` clones once per call, so it is not in the hot loop, but the model is nevertheless rebuilt from scratch at **every** point of a titration (`Serie.js:49`), i.e. subset + normalize + matrix assembly `chunks+1` times. `deepcopy(this.options)` preserves functions by reference **[verified]**, so a seeded `random` survives the clone.

### P17 — `Serie` assumes `H+` exists

`Serie.js:59` computes `-Math.log10(sol['H+'])`; if the model has no `H+` species (a non-aqueous or purely complexation system) every pH is `NaN` and `xy` is filled with `NaN`, with no error and `errorCount === 0`.

### P18 — `Equilibrium` accepts `atEquilibrium: 0`

`checkComponents` (`Equilibrium.js:350-361`) only tests `typeof … === 'number'`, so `0` passes; the β folding then computes `0^{a}` → `0` or `Infinity` for every species. Also, `if (atEq)` at `:135` and `:167` is a truthiness test, so `atEquilibrium: 0` is treated as *not fixed* and the component falls through to `cTotal.push(component.total / volume)` with `total === undefined` → `NaN`.

### P19 — `Equilibrium.defaultOptions` is incomplete

`Equilibrium.js:7-13` declares `tolerance` but not `solidTolerance` / `maxIterations`; those only get their defaults inside `newtonRaphton` (`:6-10`). The README table documents all three under `new Equilibrium(...)`, which works only because the options object is spread through unchanged. The `robustMaxTries` JSDoc (`Equilibrium.js:33`) says 15 while the code says 10.

---

## 9. Numbers to put on the page

All reproducible from the test suite.

**Acetate at pH = pKa** (`src/core/__tests__/Equilibrium.test.js:19-30`) — the textbook check:
```
model: H+ atEquilibrium 10^-4.75 ; CH3COO- total 1
       OH-     β = 1e-14      components [-1, 0]
       CH3COOH β = 10^4.75    components [ 1, 1]
→ CH3COO- = 0.5, CH3COOH = 0.5, OH- = 5.62341325190349e-10
```

**Phosphoric acid speciation** (`Equilibrium.test.js:42-91`) — one `solveRobust()` then 14 warm `solve()` calls:
```
pH 0 : H3PO4 0.9931292240233103 | H2PO4- 0.006870775553040164 | PO4--- 2.027709620648592e-22
pH 7 : H2PO4- 0.6185774619693667 | HPO4-- 0.3814117713144719
pH 14: PO4--- 0.979534617810611  | HPO4-- 0.02046537887029301
mass balance conserved to 1e-9 at every pH
```

**AgCl precipitation** (`Equilibrium.test.js:93-113` and `NewtonRaphton.test.js:28-49`):
```
Ag+ total 1, Cl- total 1, AgCl2- β = 10^5.26, AgCl solid β = 1/1.77e-10
→ Ag+ 1.3305983920629563e-5 | Cl- 1.330555526094898e-5
  AgCl2- 4.286600402043179e-10 | AgCl(s) 0.9999866935874194
```

**FeCO3 undersaturated** (`NewtonRaphton.test.js:51-80`) — the solid is offered but stays at exactly `0`, demonstrating the active-set drop-out:
```
result[6] === 0   // FeCO3 never enters the basis
```

**Acetate titration** (`Serie.test.js:51-82`): 0.1 M CH₃COO⁻ in 50 mL titrated with 0.1 M H⁺ up to 100 mL, 10 chunks → pH 8.850027953970796 → 3.0048527213601277 at the 50 mL equivalence point → 1.476861683532796, strictly monotone.

---

## 10. Suggested "how it works" narrative arc

1. **Two kinds of species.** Components (the basis) vs formed species (everything else, computed from the basis by one line of algebra).
2. **One formula.** `[S_l] = β_l Π [C_i]^{a_il}` — with the honest note that `pK` in this database is `+log₁₀ β`, and that the coefficient sign encodes consumed (+) vs released (−).
3. **The solvent is invisible.** `H2O ← OH⁻ + H⁺` becomes `OH⁻ ← −H⁺`, β = 10⁻¹⁴.
4. **Normalization.** The chain `H2CO3 ← HCO3⁻ ← CO3²⁻` is flattened to `H2CO3 ← CO3²⁻ + 2H⁺`, pK 16.63 = 10.33 + 6.30. Stoichiometry multiplies, log-constants add.
5. **`Nc` equations, `Nc` unknowns.** Mass balance (2). Everything else is explicit.
6. **Newton in log space.** Show `A_jk = Σ_l a_jl a_kl [S_l]`, the back-transform `Δc = cΔln c`, and the halving loop that keeps concentrations positive.
7. **Pinning a component** (pH buffering) folds a constant into every β and deletes a row and a column — a live demo where imposing `H+` makes the system linear.
8. **Precipitation is a switch, not a function.** The complementarity condition, the three admission rules at `NewtonRaphton.js:97-109`, the `[[A, S],[Sᵀ, 0]]` saddle-point block, and the honest admission that this is where the solver fails.
9. **Restarts and continuation.** `solveRobust`'s log-uniform multi-start; `Serie`'s "previous answer is the next initial guess", with the dilution bookkeeping in moles.
10. **Where it breaks.** P3 (`Ca(OH)2` in base returning `null`) is the best single teaching example: a solver that has the right answer to 13 digits and rejects it because of an absolute tolerance on a quantity spanning 60 decades.