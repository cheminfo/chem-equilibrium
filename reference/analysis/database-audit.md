`/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-labels.json`

# chem-equilibrium formation-constant database — analysis

## 1. Entry schema

`data/data.json` is a flat JSON array of 125 objects. **Exactly four keys exist anywhere in the file, all present on all 125 entries** — there are no optional keys, no key appears on a subset:

| key | count | type | notes |
|---|---|---|---|
| `formed` | 125/125 | `string` | product label; always the single formed species |
| `components` | 125/125 | `object` | **always exactly 2 keys** (125/125); values are the stoichiometric coefficients |
| `pK` | 125/125 | `number` (125/125 — never an object) | range −7 … 71.8 |
| `type` | 125/125 | `string` | one of 3 values |

Coefficient values observed: `1, 2, 3, 4, 6` (never 5, never fractional, never negative).

```json
{ "formed": "Ag(NH3)2+", "components": { "Ag+": 1, "NH3": 2 }, "pK": 7.2, "type": "complexation" }
```

Validation in `src/core/Equation.js:3-20` enforces: `formed` is a string, `pK` is a **number**, `type` ∈ `{acidoBasic, precipitation, complexation}`, `components` is a non-empty plain object.

## 2. `type` values

| type | count |
|---|---|
| `acidoBasic` | 39 |
| `complexation` | 47 |
| `precipitation` | 39 |

Note the task prompt guessed `solubility`; the actual token is **`precipitation`**. The upstream sheet uses six finer-grained types (`ammonia complex` 9, `cyanide complex` 7, `halide complex` 15, `monodentate ligands complex` 8, `bidentate ligands complex` 8) that `update.js` collapses into `complexation` via `/complex/i` — **that subclassification is discarded and exists only in the sheet.**

## 3. Cardinality

- **125 entries**, **125 distinct `formed` species** (no exact duplicate product — see §8 for near-duplicates)
- **73 distinct components**
- **190 distinct labels** overall
- 8 labels are both formed and component (the polyprotic chain links): `HSO4- H2PO3- HSO3- HCO3- H2PO4- HPO4-- HS- NH3`
- 65 components are never produced by any equation (terminal species: bare metal cations, `H+`, `OH-`, halides, `en`, …)

## 4. Provenance metadata — **none in `data.json`**

**Explicitly: not a single entry carries a literature reference, a source, a temperature, an ionic strength, an uncertainty, an ID, or a date.** The four keys above are all there is. There is no place in the current schema to put a citation.

However — and this is the important part — **the upstream Google Sheet already has the data, and `update.js` throws it away.** I fetched the live sheet (HTTP 200, 129 rows). Its real header is 14 columns:

```
type | AB | A | B | pk | temperature | ANameFR | BNameFR | ABNameFR | Source | Active | ANameFR | BNameFR | ABNameFR
```

`processData()` in `update.js:46-62` emits only `formed / components / pK / type`, dropping `temperature`, `Source`, and the three French name columns.

Coverage on the 127 active rows:

| field | coverage |
|---|---|
| `Source` = `http://ressources.univ-lemans.fr/AccesLibre/UM/Pedago/chimie/06/deug/CHIM105B/pdf/sem2pka.pdf` | 28 (acid/base) |
| `Source` = `http://www.ars-chemia.net/Permanent_Files/Tables/Formation_Constants_of_Complex_Ions.pdf` | 47 (all complexation) |
| `Source` = `unknown` (literal string) | 11 |
| `Source` empty | 41 (**every one of the 39 precipitation rows**, plus `HBr`, `HI`) |
| `temperature` = `298.00` | 86 |
| `temperature` empty | 41 (the same precipitation block) |
| **ionic strength** | **no such column exists anywhere** |
| `ANameFR`/`BNameFR`/`ABNameFR` | 30 of 127 rows (acid/base only, e.g. `CH3CO2H` → "acide acétique") |

So to make "the source of the data visible and searchable" you need to:
1. Add `source` + `temperature` passthrough in `update.js` (zero new data collection — 75 of 125 entries get a real URL immediately).
2. Fill the `Source`/`temperature` columns for the 39 precipitation rows and the 11 `unknown` rows in the sheet.
3. Add an **ionic strength** column to the sheet — it does not exist today, and for a Ksp/β table it matters more than temperature.
4. Consider promoting `Source` from a bare URL string to `{ url, title, page }` so it is searchable rather than a 90-character URL.
5. The FR name columns are the natural search index for a UI — currently 100% discarded.

## 5. What `update.js` does

- **URL** (`update.js:6-7`): `https://googledocs.cheminfo.org/spreadsheets/d/1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ/export?format=tsv` — a cheminfo proxy in front of Google Sheets, **TSV** despite `Papa.parse` being a CSV library (`delimiter: '\t'` is passed explicitly).
- **Filter**: `parsed.data.filter((d) => d.Active !== 'no')` — 2 rows are deactivated (`H3O+ ← H2O + H+, pK 0` and `OH- ← O-- + H+, pK 24`), leaving 127.
- **Column mapping**: `AB` → `formed`; `A`,`B` → the two `components` keys; `pk` → `pK`; `type` → `type` (with the `/complex/i` collapse).
- **pK parsing**: there is none — `dynamicTyping: true` makes PapaParse coerce the `pk` cell to a JS number, and it is assigned raw as `d.pk`. No validation, no `Number.isFinite` check. Every current cell happens to be numeric, so it works by luck; a stray `~` or `>` in the sheet would silently emit a **string** `pK` and blow up later in `Equation` with `equation expects a property "pK" that is a number`.
- **Stoichiometry parsing** (`update.js:22-38`): `/\s*(?<coefficient>\d*)\s*(?<formula>.*)/` splits a leading integer off each of `A`, `B`, `AB` (e.g. `"2 Ag+"` → 2 × `Ag+`, and `"2F-"` with no space also works). Coefficients are then divided by `nAB` and `processData` throws if `nAB !== 1`. The regex is total (`\d*` and `.*` both match empty), so it never fails — it just silently produces `{"": 1}` on an empty cell.
- **Solvent column**: **there is no solvent column.** The sheet has no notion of solvent and `update.js` never writes one. Everything is implicitly aqueous. The solvent machinery is purely a runtime concept (see §6).
- **If the sheet moved**: `fetch` returns non-2xx, and `update.js:10-14` throws `could not download the database: <status> <statusText>`. That is the good case. The dangerous failure is a **200 with different content** — a Google login/consent HTML page or a re-ordered sheet returns 200, PapaParse happily parses it, and `writeFileSync` overwrites `data.json` with garbage. There is no schema check, no row-count sanity check, no diff gate, and no `git`-level protection. Also note the header has **duplicate column names** (`ANameFR`/`BNameFR`/`ABNameFR` appear twice); PapaParse warns "Duplicate headers found and renamed" and silently renames the second set to `ANameFR_1` etc. Renaming a column in the sheet breaks the mapping silently.

**The sheet and `data.json` are already out of sync.** Running `update.js` today would produce a different file:
- **Added**: `HBr` (pK −9) and `HI` (pK −10) — present in the sheet, absent from `data.json`.
- **Reverted**: commit `2ad1c5b "fix: H2PO3 to H3PO3"` hand-edited `data.json` (`H2PO3`→`H3PO3`, `HPO3-`→`H2PO3-`, `PO3--`→`HPO3--`, and pK `2`→`1.26`, `6.59`→`6.7`). **The sheet was never updated**, so the next `npm run update` silently undoes that bug fix. This is the single most urgent finding: the generated file has been hand-patched and the generator will overwrite it.

## 6. How `Helper` interprets `type` and `solvent`

**`type`** — `Helper` itself never reads `type`. It is consumed downstream:
- `Equation.js:14` validates it against the 3-value allowlist.
- `EquationSet.js:59,81` uses it as an optional filter in `getSpecies`/`getComponents` (`options.type`).
- `EquationSet.js:215` is the only semantic use: `solid: eq.type === 'precipitation'` in `getModel()` — precipitation species become solid phases in the solver. `acidoBasic` and `complexation` are behaviourally identical.

**`solvent`** — defaults to `'H2O'` (`Helper.js:7-9`) and does two distinct things:

1. **`processDB` (Helper.js:124-144) — multi-solvent pK selection.** If `pK` is not a number, *or* the solvent is not `H2O`, it treats `db[i].pK` as a **map keyed by solvent** and replaces it with `pK[solvent]`; entries lacking that key are dropped from the set. So the library already supports `"pK": { "H2O": 4.7, "DMSO": 12.3 }` — **but no entry in `data.json` uses it, and `update.js` cannot produce it** (the sheet has no solvent column). This is dead capability. Note the latent bug: with a non-`H2O` solvent and a numeric `pK`, `db[i].pK[solvent]` is `undefined` on a number, so the entry is dropped rather than erroring — a non-aqueous run silently yields an almost-empty database.
2. **`getNormalized(solvent)` → `Equation.withSolvent` (Equation.js:62-92) — algebraic elimination.** The solvent is removed from the equation system: if the solvent *is* the formed species (the `H2O ← OH- + H+` autoprotolysis row), the equation is inverted (`pK` negated, first component becomes the new product, remaining coefficients negated); if the solvent appears as a *component*, it is deleted. This is why the `H2O` entry with `pK 14` must exist in the database.

Also `Helper.js:82` — `if (label === this.solvent)` is a **bug**: `this.solvent` is never assigned (it lives at `this.options.solvent`), so it is always `undefined` and the "solvent total is forced to 0" guard never fires.

## 7. Chemical notation — react-mf rendering

Full lists are in the output file; here is the summary.

**Charge convention: this database uses repeated sign characters exclusively** — `++`, `+++`, `++++`, `--`, `---`, `----`. **No label uses `+3` / `3+` / `(2-)` notation anywhere.** That is internally consistent, but it collides badly with `mf-parser` (which `react-mf` depends on, `react-mf@^…` → `mf-parser@^3.6.0`).

I installed `mf-parser` and ran all 190 labels through it. Results:

**(a) 7 labels throw** — `en` and the six complexes containing it: `Mn(en)3++ Fe(en)3++ Co(en)3++ Co(en)3+++ Ni(en)3++ Cu(en)2++`. Error: `found a lowercase not following an uppercase`. `en` is the ligand *abbreviation* for ethylenediamine, not a formula. `react-mf` catches the throw and falls back to the raw string, so these render as literal text with no subscripts — degraded but not wrong.

**(b) 52 labels render with the charge SILENTLY DELETED** — this is the serious one. `mf-parser` drops a trailing `-`/`--`/`---` charge whenever it directly follows a **digit**, because the digit is consumed as a multiplier and the minus is then discarded with no error:

```
parse('SO4--')  -> [atom S, atom O, multiplier 4]        // no charge token at all
toDisplay(...)  -> "SO" + subscript "4"                  // renders as SO₄, charge invisible
parse('Cl-')    -> [atom Cl, charge -1]                  // fine, renders Cl⁻
parse('Fe+++')  -> [atom Fe, charge +3]                  // fine, positives always work
```

So `Cl-`, `S--`, `OH-`, `BrO-`, `NH3` are fine, but **`SO4--` renders as "SO₄", `CO3--` as "CO₃", `PO4---` as "PO₄", `Fe(CN)6----` as "Fe(CN)₆"** — a neutral-looking sulfate. Positive charges after digits are unaffected (`Zn(NH3)4++` renders correctly). The affected 52:

`Ag(CN)2- Ag(S2O3)2--- AgBr2- AgCl2- AgI2- AlF4- AlF6--- Au(CN)2- BeF4-- BrO3- C2O4-- CH2ClCO2- CO3-- Cd(CN)4-- Cd(SCN)4-- ClO2- ClO4- Co(C2O4)3---- CrO4-- Cu(CN)2- Cu(OH)4-- CuBr2- CuCl2- CuI2- Fe(C2O4)3--- Fe(CN)6--- Fe(CN)6---- H2PO3- H2PO4- HCO2- HCO3- HPO3-- HPO4-- HSO3- HSO4- Hg(SCN)4-- HgBr4-- HgCl4-- HgI4-- IO3- NH2- NO2- NO3- Ni(CN)4-- PO4--- PbCl4-- PbI4-- S2O3-- SO3-- SO4-- SnF6-- Zn(OH)4--`

**67 of the 125 entries** contain at least one label that will not render correctly. Fixing this means normalising charges to a form `mf-parser` accepts — `SO4(2-)` parses correctly (charge −2), as does the single-sign `Cl-`. A migration `--{n}` → `({n}-)` applied only where a digit precedes the sign would fix all 52 without touching the 131 that work.

**(c) Carboxyl notation is inconsistent across the dataset** — both `COOH/COO-` and `CO2H/CO2-` are in use:

| couple | acid | base | consistent? |
|---|---|---|---|
| benzoic | `C6H5COOH` | `C6H5COO-` | yes (COO) |
| propanoic | `C2H5COOH` | `C2H5COO-` | yes (COO) |
| formic | `HCO2H` | `HCO2-` | yes (CO2) |
| chloroacetic | `CH2ClCO2H` | `CH2ClCO2-` | yes (CO2) |
| **acetic** | **`CH3CO2H`** | **`CH3COO-`** | **no — mixed within one equation** |

Acetic acid is the only couple whose acid and base use different conventions. All parse fine in `mf-parser`, but a text search for "CH3COOH" finds nothing and "acetate" appears under two spellings.

**(d) Other notation flags**: `(C2H5)3N` / `(C2H5)3NH+` parse correctly (parentheses are fine). `Fe(H2O)6+++` / `Al(H2O)6+++` / `Fe(H2O)5OH++` / `Al(H2O)5OH++` write the aqua ligands explicitly while every other metal entry uses the bare ion — see §8.

## 8. Duplicates and inconsistencies

No `formed` value appears twice. The real problems are semantic:

**Outright errors (charge balance fails — 2 entries):**
- **`Mn(OH)2 ← {"Mn--": 1, "OH-": 2}`** — `Mn--` should be `Mn++`. Charge sums to −4 for a neutral solid. And `Mn++` *is* used correctly in `Mn(en)3++`, so manganese(II) carries two labels, one of them wrong.
- **`PbI2 ← {"Pb++": 1, "I--": 2}`** — `I--` should be `I-`. Charge sums to −2 for a neutral solid. `I-` is used correctly in `AgI`, `CuI2-`, `PbI4--`, `HgI4--`.

Both survive `Equation`'s validation because nothing checks charge or mass balance.

**Stoichiometry errors — all 6 `en` complexes:** the formula says 2–3 ethylenediamine but the components say 1.

| formed | components | should be | pK |
|---|---|---|---|
| `Mn(en)3++` | `en: 1` | `en: 3` | 5.81 |
| `Fe(en)3++` | `en: 1` | `en: 3` | 9.72 |
| `Co(en)3++` | `en: 1` | `en: 3` | 14.11 |
| `Co(en)3+++` | `en: 1` | `en: 3` | 48.68 |
| `Ni(en)3++` | `en: 1` | `en: 3` | 17.61 |
| `Cu(en)2++` | `en: 1` | `en: 2` | 19.54 |

The pK values are clearly cumulative β₃ (β₂ for Cu), but the model will treat them as 1:1 complexes — so these six equations are quantitatively wrong in the solver, not just cosmetically. The bug originates in the sheet (the `B` cell is `en` with no leading coefficient, unlike `"2 NH3"`, `"6 CN-"`, etc.).

**Same chemical, two labels (never linked):**
- Fe(III): `Fe(H2O)6+++` / `Fe(H2O)5OH++` in the acid/base rows vs bare `Fe+++` in complexation and `Fe(OH)3`. The solver treats `Fe(H2O)6+++` and `Fe+++` as two unrelated components, so iron hydrolysis and iron complexation cannot be modelled together.
- Al(III): identical problem — `Al(H2O)6+++` / `Al(H2O)5OH++` vs `Al+++`.
- Acetate: `CH3CO2H` vs `CH3COO-` (see §7c).
- Manganese: `Mn--` vs `Mn++` (typo, above).
- Iodide: `I--` vs `I-` (typo, above).

**Thermodynamically suspect pK values (non-monotonic cumulative β — adding ligands must increase log β):**
- `Cd(NH3)4++` pK **7** but `Cd(NH3)6++` pK **5.41** — β₆ < β₄, impossible.
- `AlF4-` pK **8.3** but `AlF6---` pK **4.4** — β₆ < β₄, impossible.

**Suspicious repeated values (likely copy/paste in the sheet):**
- `HgBr4--` pK **4.48** = `PbI4--` pK **4.48`. The Hg–Br value is also wildly out of line with its siblings `HgCl4--` 15.7 and `HgI4--` 30.28 (literature log β₄ for HgBr₄²⁻ is ≈21) — almost certainly a wrong row.
- `AgBr2-` pK **11** = `AgI2-` pK **11**, identical to 2 s.f. for two different halides.

**Staleness:** `data.json` is missing `HBr`/`HI` and contains a hand-fix (`H3PO3` chain) that no longer matches the sheet — see §5.

## Output file

Full machine-readable dump — every distinct formed-species and component label with declared charge, type, pK, stoichiometry, usage counts, notation flags, and per-label `mf-parser` diagnostics (`parses`, `mfParserCharge`, `chargeSilentlyDropped`, approximate rendered form):

**`/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-labels.json`** (89 KB)

Top-level keys: `entryCount`, `entryKeys`, `counts`, `typeCounts`, `formedSpecies[125]`, `components[73]`, `allLabels[190]`, `labelsUnparseableByMfParser[7]`, `labelsWithSilentlyDroppedCharge[52]`.