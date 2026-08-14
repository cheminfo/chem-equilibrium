# chem-equilibrium

[![NPM version](https://img.shields.io/npm/v/chem-equilibrium.svg)](https://www.npmjs.com/package/chem-equilibrium)
[![npm download](https://img.shields.io/npm/dm/chem-equilibrium.svg)](https://www.npmjs.com/package/chem-equilibrium)
[![test coverage](https://img.shields.io/codecov/c/github/cheminfo/chem-equilibrium.svg)](https://codecov.io/gh/cheminfo/chem-equilibrium)
[![license](https://img.shields.io/npm/l/chem-equilibrium.svg)](https://github.com/cheminfo/chem-equilibrium/blob/main/LICENSE)

Compute chemical equilibrium.

Given the total amount of each component and the formation constants of the
species they form, the solver returns the concentration of every specie at
equilibrium. Acid/base, complexation and precipitation reactions are supported,
and a component can either be given as a total amount or pinned to a fixed
concentration at equilibrium (typically `H+`, to work at an imposed pH).

## Installation

```console
npm install chem-equilibrium
```

This package is ESM-only. CommonJS consumers can still `require()` it on Node.js
22.12 or later (any 24.x and above also works), or switch to `import`.

## Usage

### Solving an explicit model

Describe the components and the species they form, then solve:

```js
import { Equilibrium } from 'chem-equilibrium';

const model = {
  components: [
    // the pH is imposed, so H+ is fixed at equilibrium
    { label: 'H+', atEquilibrium: 10 ** -4.75 },
    // 1 mol of acetate is introduced
    { label: 'CH3COO-', total: 1 },
  ],
  formedSpecies: [
    // coefficients follow the order of `components`
    { label: 'OH-', beta: 10 ** -14, components: [-1, 0] },
    { label: 'CH3COOH', beta: 10 ** 4.75, components: [1, 1] },
  ],
};

const solution = new Equilibrium(model).solveRobust();
// at pH = pKa the acid and its conjugated base are equimolar:
// {
//   'CH3COO-': 0.5,
//   'OH-': 5.62341325190349e-10,
//   CH3COOH: 0.5,
//   'H+': 0.00001778279410038923
// }
```

`solveRobust()` retries with random starting points until the Newton-Raphson
algorithm converges, and returns `null` if it never does. `solve()` runs a
single pass from the concentrations given to `setInitial()`, which is much
faster when solving a series of closely related systems.

### Using the bundled database

`Helper` builds the model for you from the bundled database of formation
constants — you only declare which species you put in the solution:

```js
import { Helper } from 'chem-equilibrium';

const helper = new Helper();
helper.addSpecie('CO3--', 0.1);
helper.setAtEquilibrium('H+', 10 ** -7); // work at pH 7

const solution = helper.getEquilibrium().solveRobust();
// {
//   'CO3--': 0.000038978124414873076,
//   'OH-': 1e-7,
//   'HCO3-': 0.08333375231890001,
//   H2CO3: 0.01662726955668513,
//   'H+': 1e-7
// }
```

`Helper` walks the database to pull in every specie reachable from the ones you
added, so `HCO3-` and `H2CO3` appear without being declared. Individual
equations can be turned off with `disableEquation(formedSpecie)` and back on
with `enableEquation(formedSpecie)` / `enableAllEquations()`.

### Titrations and speciation curves

`Serie` solves a whole series of equilibria, reusing each solution as the
starting point of the next one:

```js
import { Helper, Serie } from 'chem-equilibrium';

const serie = new Serie(new Helper());
const titration = serie.getTitration({
  solution: { type: 'CH3COO-', concentration: 0.1, volume: 0.05 },
  titrationSolution: { type: 'H+', concentration: 0.1, volume: 0.1 },
  chunks: 5,
});

titration.volumes;
// [0, 0.02, 0.04, 0.06, 0.08, 0.1]
titration.species;
// ['H+', 'CH3COO-', 'OH-', 'CH3CO2H']
titration.xy;
// volume / pH pairs, ready to plot:
// [0, 8.85, 0.02, 4.876, 0.04, 4.102, 0.06, 2.037, 0.08, 1.636, 0.1, 1.477]
```

`getSolutions()` sweeps one specie instead of adding a titrant — here the pH,
from 0 to 14:

```js
const helper = new Helper();
helper.addSpecie('CH3COO-', 1);

const sweep = new Serie(helper).getSolutions({
  varying: 'H+',
  isFixed: true, // pin H+ at equilibrium rather than as a total amount
  log: true, // `from` and `to` are -log10 values, i.e. pH units
  from: 0,
  to: 14,
  chunks: 14,
});

sweep.x; // [0, 1, 2, ..., 14]
sweep.solutions[5];
// {
//   'CH3COO-': 0.6661394245831219,
//   'OH-': 9.999999999999999e-10,
//   CH3CO2H: 0.333860575416878,
//   'H+': 0.00001
// }
```

## API

Everything is a named export; this package has no default export. The classes
are `Equilibrium`, `Helper`, `Serie`, `Equation` and `EquationSet`, plus the
low-level `newtonRaphton` solver and the bundled data, `database` and
`speciesNames`. The package is written in TypeScript and ships its own types.

### `new Equilibrium(model[, options])`

| option           | default       | description                                                            |
| ---------------- | ------------- | ---------------------------------------------------------------------- |
| `volume`         | `1`           | Volume of the solution; totals are divided by it to get concentrations |
| `robustMaxTries` | `10`          | Number of random restarts attempted by `solveRobust()`                 |
| `random`         | `Math.random` | Random number generator used to initialize concentrations              |
| `autoInitial`    | `true`        | Reuse the result of `solve()` as the next starting point               |
| `tolerance`      | `1e-15`       | Convergence tolerance on the dissolved species                         |
| `solidTolerance` | `1e-5`        | Convergence tolerance on the solid species                             |
| `maxIterations`  | `99`          | Iterations before Newton-Raphson gives up                              |

Methods: `solve()`, `solveRobust()`, `setInitial(concentrations)`.

A `model` has a `components` array (`{ label, total }` or
`{ label, atEquilibrium }`) and a `formedSpecies` array
(`{ label, beta, components, solid }`), where `components` is the array of
stoechiometric coefficients in the order the components were declared, and
`solid: true` marks a precipitate.

### `new Helper([options])`

| option     | default   | description                                                  |
| ---------- | --------- | ------------------------------------------------------------ |
| `solvent`  | `'H2O'`   | Solvent; equations without a pK for it are dropped           |
| `database` | (bundled) | Replace the bundled database with your own list of equations |
| `extend`   | `false`   | Append `database` to the bundled one instead of replacing it |

Methods: `addSpecie(label[, total])`, `setTotal(label, total)`,
`setAtEquilibrium(label, value)`, `resetSpecies()`, `setOptions(options)`,
`disableEquation(formedSpecie)`, `enableEquation(formedSpecie)`,
`enableAllEquations()`, `getSpecies(options)`, `getComponents(options)`,
`getEquations(options)`, `getModel()`, `getEquilibrium()`, `clone()`.

### `new Serie(helper)`

Methods: `getTitration(options)` and `getSolutions(options)`. Both accept
`chunks` (number of intervals, default `200`, so `chunks + 1` points are
computed) and forward any other option to the underlying `Helper` and
`Equilibrium`.

## Database

The formation constants live in
[`src/data/database.ts`](./src/data/database.ts), which is the source of truth —
edit it there. Each entry carries its `pK`, the temperature and the literature
source when they are documented, and a `warning` when the value is known to be
doubtful:

```js
import { database, speciesNames } from 'chem-equilibrium';

database.length; // 129
speciesNames['CO3--'].name; // 'carbonate ion'
```

`pK` is always the base-10 logarithm of the **formation** constant of `formed`
from its components, so `beta = 10 ** pK`. For an acid/base couple that number
is the pKa; for a precipitation equilibrium it is `-log10(Ksp)`; for a complex
it is `+log β`.

An entry marked `active: false` is kept for the record — it documents a constant
that was considered and deliberately left out — and never enters a model, so
`Helper` builds its systems from the 127 active ones:

```js
database.filter((entry) => entry.active !== false).length; // 127
```

Browse the whole table, sources included, on
[equilibrium.cheminfo.org/#/data](https://equilibrium.cheminfo.org/#/data).

## [API Documentation](https://cheminfo.github.io/chem-equilibrium/)

## License

[MIT](./LICENSE)
