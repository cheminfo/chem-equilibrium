# Changelog

## [2.2.1](https://github.com/cheminfo/chem-equilibrium/compare/v2.2.0...v2.2.1) (2017-03-30)

### Miscellaneous

- stop tracking the built `dist` directory and ignore it ([84e30ee](https://github.com/cheminfo/chem-equilibrium/commit/84e30ee))
- remove the generated documentation from the repository ([3404439](https://github.com/cheminfo/chem-equilibrium/commit/3404439))

## [2.2.0](https://github.com/cheminfo/chem-equilibrium/compare/v2.1.0...v2.2.0) (2017-03-29)

### ⚠ BREAKING CHANGES

- `Factory` is renamed to `Helper`, and its getters change signature. Shipped as a minor release at the time; recorded here as it happened ([4a7a3d7](https://github.com/cheminfo/chem-equilibrium/commit/4a7a3d7), [49162a8](https://github.com/cheminfo/chem-equilibrium/commit/49162a8))

### Features

- add the `Serie` helper, which solves a whole series of equilibria ([fce72f9](https://github.com/cheminfo/chem-equilibrium/commit/fce72f9), [80d31d3](https://github.com/cheminfo/chem-equilibrium/commit/80d31d3))
- add titration support to `Serie` ([919e9ad](https://github.com/cheminfo/chem-equilibrium/commit/919e9ad))
- add `clone()` to `Helper` and `EquationSet` ([af65451](https://github.com/cheminfo/chem-equilibrium/commit/af65451), [434288c](https://github.com/cheminfo/chem-equilibrium/commit/434288c))
- add `enableAllEquations()` ([ff466b4](https://github.com/cheminfo/chem-equilibrium/commit/ff466b4))
- add an `includeDisabled` option to the getters ([8ec3a1a](https://github.com/cheminfo/chem-equilibrium/commit/8ec3a1a))

### Bug Fixes

- fix a critical bug in the Newton-Raphson solver ([325b11d](https://github.com/cheminfo/chem-equilibrium/commit/325b11d))
- fix solid Ksp values when a component is fixed ([432f370](https://github.com/cheminfo/chem-equilibrium/commit/432f370))
- add the solvent by default in `resetSpecies()` ([e0d489f](https://github.com/cheminfo/chem-equilibrium/commit/e0d489f))
- fix `setOptions()` on the helper ([51a4c17](https://github.com/cheminfo/chem-equilibrium/commit/51a4c17))
- fix the order of the species labels ([10adebc](https://github.com/cheminfo/chem-equilibrium/commit/10adebc))

## [2.1.0](https://github.com/cheminfo/chem-equilibrium/compare/v2.0.0...v2.1.0) (2016-08-30)

### Features

- add a static function returning the labels of the database ([46b538e](https://github.com/cheminfo/chem-equilibrium/commit/46b538e))

## 2.0.0 (2016-08-30)

First published release of the solver.

### Features

- solve chemical equilibria with a Newton-Raphson algorithm ([8cef5d6](https://github.com/cheminfo/chem-equilibrium/commit/8cef5d6))
- support the formation of solid species, so precipitation is modelled ([0c521c2](https://github.com/cheminfo/chem-equilibrium/commit/0c521c2))
- add a helper that builds the model from a bundled reaction database ([3bbca5c](https://github.com/cheminfo/chem-equilibrium/commit/3bbca5c), [a48a37f](https://github.com/cheminfo/chem-equilibrium/commit/a48a37f))
- allow a custom random number generator to be supplied ([b13b397](https://github.com/cheminfo/chem-equilibrium/commit/b13b397))

### Bug Fixes

- fix the solver when a total concentration is zero ([406b2de](https://github.com/cheminfo/chem-equilibrium/commit/406b2de))
- fix the prediction with no solid, and with more than one solid ([718f398](https://github.com/cheminfo/chem-equilibrium/commit/718f398), [64ddaad](https://github.com/cheminfo/chem-equilibrium/commit/64ddaad))
- fix the `deltaC` convergence check ([ad7a728](https://github.com/cheminfo/chem-equilibrium/commit/ad7a728))
- fix the component labels ([a4a0d60](https://github.com/cheminfo/chem-equilibrium/commit/a4a0d60))
- run on Node.js 4 ([ba55c81](https://github.com/cheminfo/chem-equilibrium/commit/ba55c81))
