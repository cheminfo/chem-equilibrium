# Reference material

Provenance for `equilibrium.cheminfo.org`, which replaces six cheminfo visualizer
views. Nothing here is shipped or built — it exists so the replacement can be
checked against the originals.

## The six legacy views

Each view is a cheminfo visualizer document stored on `couch.cheminfo.org`.
`legacy-views/` holds a snapshot of every `view.json` taken on 2026-08-14.

| Snapshot                             | Couch document id                  | Live URL                                                                                                                                                              |
| ------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `view-free.json`                     | `2ca3866c831d4f1d63dec1ee20fe3d1d` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2F2ca3866c831d4f1d63dec1ee20fe3d1d%2Fview.json&loadversion=true&fillsearch=free    |
| `view-acidbase.json`                 | `380a0f698a1fcf16c4bb44624f60f131` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2F380a0f698a1fcf16c4bb44624f60f131%2Fview.json&loadversion=true&fillsearch=Acid-Base |
| `view-precipitation.json`            | `72a71f22707571c0c9f4ebcc75817c92` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2F72a71f22707571c0c9f4ebcc75817c92%2Fview.json&loadversion=true&fillsearch=Precipitation |
| `view-exercices-ph.json`             | `981a59e7b215f273ea8767a1a8e38179` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2F981a59e7b215f273ea8767a1a8e38179%2Fview.json&loadversion=true&fillsearch=Exercices+pH |
| `view-titration.json`                | `aaf4d854d2d04c477e5bf604ac5b0934` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2Faaf4d854d2d04c477e5bf604ac5b0934%2Fview.json&loadversion=true&fillsearch=Titration+acid%2Fbase |
| `view-calcul-ph.json`                | `e71d251b9aee436715c821706dab07bd` | https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2Fe71d251b9aee436715c821706dab07bd%2Fview.json&loadversion=true&fillsearch=Calcul+de+pH |

All six load the library from `https://www.lactame.com/lib/chem-equilibrium/2.2.x/`,
so `.github/workflows/lactame.yml` must keep publishing under the package name
`chem-equilibrium` for them to keep working.

## Analysis

`analysis/` holds the reverse-engineering of those views and of the library:

| File                                    | Content                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `algorithm.md`                          | Full description of the solver, the source for the site's *How it works* pages |
| `tool-titration-and-acidbase.md`        | Functional spec of the titration and acid/base views                        |
| `tool-precipitation-and-free.md`        | Functional spec of the precipitation and free-equilibrium views             |
| `tool-ph-calculation-and-exercises.md`  | Functional spec of the pH-calculation and pH-exercises views                 |
| `database-audit.md`                     | Schema, provenance coverage and data errors of the formation-constant table |
| `react-mf-notation.md`                  | How `mf-parser` reads the species labels, and which ones it gets wrong      |
| `scaffold-reference-sites.md`           | Configuration of `regexp.cheminfo.org` and `iupac.cheminfo.org`             |
| `open-gaps.md`                          | Everything that was still unverified at the end of the analysis pass        |
| `extracted-*.json`                      | Machine-readable extracts (indicators, pKa tables, exercises, labels)       |

## Upstream spreadsheets

The two Google Sheets the legacy tools read at runtime are now vendored under
`packages/chem-equilibrium/data/`; see the README there for how they are refreshed.

| Sheet                                          | Content                        |
| ---------------------------------------------- | ------------------------------ |
| `1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ` | Formation constants            |
| `1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU` | pH indicator transition ranges |
