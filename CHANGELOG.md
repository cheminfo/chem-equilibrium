# Changelog

## [3.0.0](https://github.com/cheminfo/chem-equilibrium/compare/v2.2.1...v3.0.0) (2026-08-14)


### ⚠ BREAKING CHANGES

* Helper.eqSet is now Helper.equationSet.
* database now holds 129 entries instead of 127; the two added are marked active: false. Consumers reading it directly must skip them.
* the package is ESM-only and has no default export; import the named exports instead.
* corrected constants change computed results — the phosphorous acid chain, Mn(OH)2, PbI2 and the six ethylenediamine complexes — and the solid convergence test is now relative, so hydroxide systems that used to return null converge.
* the package has no default export anymore. Use `import { Equilibrium } from 'chem-equilibrium'` instead of `import Equilibrium from 'chem-equilibrium'`, and the UMD bundle exposes `ChemEquilibrium.Equilibrium` instead of `ChemEquilibrium.default`. The `Equilibrium.Helper` and `Equilibrium.Serie` static properties are gone, import `Helper` and `Serie` directly.

### Features

* drop default exports in favour of named exports ([5336223](https://github.com/cheminfo/chem-equilibrium/commit/5336223b1d96864fe87b6c0663d8103add2b2b8f))
* make src/data the source of truth and record inactive entries ([373c6dc](https://github.com/cheminfo/chem-equilibrium/commit/373c6dcf3de2b7d304a4c59fc4db499a87e13404))
* migrate package to ESM and current tooling ([3d5d1ee](https://github.com/cheminfo/chem-equilibrium/commit/3d5d1ee2db2a250bf9eb97a1ab7fb19d98c63bad))
* move to a monorepo with equilibrium.cheminfo.org ([335dbda](https://github.com/cheminfo/chem-equilibrium/commit/335dbda762d3b2fd961f01ca14e6ba45e33bd35d))
* name the site equilibrium.cheminfo.org and mark where curves bend ([69bfd6a](https://github.com/cheminfo/chem-equilibrium/commit/69bfd6a1df59c0e6d0442eab58fa425dce99f95b))
* rename Helper.eqSet to equationSet and document the optional types ([5f99614](https://github.com/cheminfo/chem-equilibrium/commit/5f99614953dba144b76c0a7ba5bd024ebd268916))
* set the name as EquiLibrium and inline the EPFL logo ([92f2ced](https://github.com/cheminfo/chem-equilibrium/commit/92f2ced76f8011ec15bd4808666ef4c2551e1e98))
* ship only the solver, and move the site to its own repository ([7a154e8](https://github.com/cheminfo/chem-equilibrium/commit/7a154e83aea8a54f2547729f677bfc486d84bb30))


### Bug Fixes

* build the library before linting ([3ca1200](https://github.com/cheminfo/chem-equilibrium/commit/3ca12008d0b561990a42494700640437f14ca46b))
* H2PO3 to H3PO3 ([2ad1c5b](https://github.com/cheminfo/chem-equilibrium/commit/2ad1c5be7603886f675314cd017db25a0151e056))
* name ethylenediamine by its formula rather than en ([ff8c88e](https://github.com/cheminfo/chem-equilibrium/commit/ff8c88e642d6979eb9f957d3afdcf12eba5709a8))
* restore the browser bundle build ([da9cd6c](https://github.com/cheminfo/chem-equilibrium/commit/da9cd6c4759384c659f94ea0aea975aeb39325bb))

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
