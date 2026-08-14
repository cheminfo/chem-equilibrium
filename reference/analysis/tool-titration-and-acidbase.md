Both datasets extracted. Here is the complete specification.

---

# Files written

- `/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-titration.json` — the **full pH-indicator dataset** (25 raw sheet rows → 21 grouped indicators, with pH transition ranges, acid/base colours, gradient stops, English names) plus source/provenance metadata.
- `/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-acidbase.json` — the **71 selectable acid/base species** and the **39 `acidoBasic` equations with pK** that both tools draw on (from `data/data.json` of this repo).
- `/private/tmp/claude-501/.../scratchpad/indicators-raw.tsv` — the raw TSV as fetched.

---

# TOOL 1 — `view-titration.json` — « Démonstration titrage acide / base »

*(Acid/base titration demonstration)* — visualizer view v2.156.1, 15 modules, 4 layers (`Default layer` = student view, `Admin`, `Twig`, `Actions` = editing layers).

Library alias: `ChemEquilibrium` → `https://www.lactame.com/lib/chem-equilibrium/2.2.0/chem-equilibrium.min`. `init_script` is empty.

## 1.1 Purpose / pedagogic scenario

Simulate a **complete acid–base titration curve** (pH vs volume of titrant added) for any pair of the 71 acid/base species in the chem-equilibrium database, rigorously — i.e. by solving the full multi-equilibrium system at every point, not by the textbook piecewise approximations. The student:

1. picks the analyte and the titrant, their concentrations and volumes;
2. sees the pH curve appear, together with the list of acid–base couples the solver actually used and their pK values;
3. picks a **colour indicator** from a real list of 21 laboratory indicators; the graph is then flooded with the indicator's colour as a function of pH, so the student can *see* whether that indicator's transition range falls on the equivalence jump;
4. hovers the curve to read, at that exact point, the volume added, the total volume, the pH, the indicator colour at that pH, and the **full speciation** (concentration and −log of concentration of every species present).

## 1.2 Modules and layout (Default layer = what the student sees)

| id | type | Title (FR) | English | position |
|---|---|---|---|---|
| 3 | `edition/onde` | **Préférences** | Preferences / input form | top-left |
| 10 | `edition/slick_grid` | **Couple(s) acide-base en jeu** | Acid–base couple(s) involved | top-middle |
| 5 | `display/template-twig` | **Données calculées** | Computed data | top-right |
| 2 | `science/spectra/spectra_displayer` | **Courbe de titration** | Titration curve | bottom, full width |
| 9 | `edition/slick_grid` | **Liste des indicateurs** | List of indicators | right column |
| 11 | `client_interaction/button_action` | (label **Help**) | Help | small button |

Hidden on the student layer: `1` (titration compute), `4` (schema builder), `6` (indicator loader), `7` (indicator colouring), `8` (Error count), `12`/`13` (object inspectors on `mouseTracking` and `result`), `14` (the Twig template source), `15` (toolbar action handler).

## 1.3 Every user input

Module 4 (`execOnLoad`) builds the JSON-schema for the ONDE form; module 3 renders it and re-submits on every change (`debouncing: 200 ms`, `hasButton: onload` so it fires once at startup). Emitted variable: **`form`**.

**Group `solution` — label « Solution à titrer » (*Solution to be titrated* / analyte)**

| field | label (FR) | English | type | default | notes |
|---|---|---|---|---|---|
| `type` | Acide / Base | Acid / Base | enum | **`CO3--`** | dropdown of the 71 `acidoBasic` species, alphabetically sorted (`helper.getSpecies({type:'acidoBasic'})`) |
| `concentration` | Concentration (mol/L) | same | number | **0.1** | mol/L, no min/max enforced |
| `volume` | Volume (mL) | same | number | **20** | mL; divided by 1000 before the computation |

**Group `titrationSolution` — label « Solution de titration » (*Titrant solution*)**

| field | label (FR) | English | type | default | notes |
|---|---|---|---|---|---|
| `type` | Acide / Base | Acid / Base | enum | **`HCl`** | same 71-species list |
| `concentration` | Concentration (mol/L) | same | number | **0.1** | mol/L |
| `volume` | Volume (mL) | same | number | **50** | mL — this is the **end** of the titration sweep, not a burette capacity |

The 71 species: `(C2H5)3N, (C2H5)3NH+, Al(H2O)5OH++, Al(H2O)6+++, BrO-, C2H5COO-, C2H5COOH, C2H5NH2, C2H5NH3+, C5H5N, C5H5NH+, C6H5COO-, C6H5COOH, C6H5NH2, C6H5NH3+, CH2ClCO2-, CH2ClCO2H, CH3CO2H, CH3COO-, CH3NH2, CH3NH3+, CN-, CO3--, Cl-, ClO-, ClO2-, ClO4-, F-, Fe(H2O)5OH++, Fe(H2O)6+++, H+, H2CO3, H2O, H2PO3-, H2PO4-, H2S, H2SO3, H2SO4, H3PO3, H3PO4, HBrO, HCN, HCO2-, HCO2H, HCO3-, HCl, HClO, HClO2, HClO4, HF, HIO3, HNO2, HNO3, HOCN, HPO3--, HPO4--, HS-, HSO3-, HSO4-, IO3-, NH2-, NH3, NH4+, NO2-, NO3-, OCN-, OH-, PO4---, S--, SO3--, SO4--`.

**Other interactive controls**

- **« Liste des indicateurs »** grid (module 9): click a row → emits `indicator` (the whole row) and `gr` (its gradient). The first row is the pseudo-indicator **`none`** (no colouring).
- **Graph mouse hover** (module 2, `mouseTracking: track`, `trackingAxis: x`) → emits `mouseTracking`; drives both the "Données calculées" panel and the live indicator-colour swatch.
- **Graph zoom**: `zoom: xy`, mouse wheel disabled.
- **Toolbar of the graph**: `Clear indicator` (fa-eraser → action `clearColor`), `Export as tab-delimited` (fa-save → action `exportTSV`), `Show fullscreen`.
- **Help button** (module 11, label `Help`) → actionscript `help`, opens `https://docs.google.com/document/d/1quyyL8yMrs5Bo1p_-d8mOTMp1uDTjQYEeSRW_ar7z80/edit?usp=sharing` in a 1000×800 `UI.dialog` iframe.

## 1.4 Every output panel

### A. « Courbe de titration » (Titration curve) — module 2, spectra_displayer

- **Series**: single continuous line, variable `xy`, colour RGB(1,1,255) (blue), stroke width 1, tracking on.
- **X axis**: label **`Titration volume [L]`**, auto min/max, 5 primary ticks. Values are volume of titrant added, **in litres** (0 → `titrationSolution.volume/1000`).
- **Y axis**: label **`pH`**, hard-clamped **min 0 / max 14**, 5 primary ticks.
- **Overlay**: `colorAnnotations` — 100 stacked semi-transparent rectangles (`fillOpacity 0.5`, `strokeWidth 0`), each spanning 0.14 pH units of the y-range, filled with the selected indicator's colour at that pH. This paints the indicator's colour transition as a horizontal band across the plot.

### B. « Couple(s) acide-base en jeu » (Acid–base couple(s) involved) — module 10, slick grid

Fed by `equations` (`result.equations`, i.e. only the equations the solver actually retained for the chosen pair). Columns:

| column | content |
|---|---|
| **Equation** | Twig renderer: `{{rendertype(formed,"mf")}} ⇄ <components>` — molecular formulas rendered as subscripted formulas; stoichiometric coefficients printed when ≠ 1, joined by `+`. So e.g. `HCO3- ⇄ CO3-- + H+`. |
| **pK** | the equation's pK |

Row height 30 px, read-only, row selection model.

### C. « Données calculées » (Computed data) — module 5, Twig template

Template source is module 14 (an HTML code editor emitting `twigTemplate`). Inputs: `mouseTracking`, `trackColor`, `form`, `result`.

Table 1 (with `idx = mouseTracking.xy.indexClosest`):

| label (FR) | English | value |
|---|---|---|
| **Volume ajouté** | Volume added | `mouseTracking.xy.xExact * 1000` mL, 4 significant figures |
| **Volume total** | Total volume | `(form.solution.volume/1000 + xExact) * 1000` mL, 4 s.f. |
| **pH** (1.5em) | pH | `-log10(result.solutions[idx]['H+'])`, format `0.00` |
| **Couleur indicateur** | Indicator colour | a 100×20 px `div` filled with `trackColor.color` — only rendered when an indicator is selected |

Table 2 — one row per species (`result.species`), bordered:

| Espèce (Species) | `[]` | `-log[]` |
|---|---|---|
| formula rendered via the `mf` renderer, using `result.speciesNew` (a copy where `-`/`--` are wrapped in parentheses so the formula renderer subscripts them correctly) | `result.solutions[idx][key]`, 4 s.f. | `-log10(...)`, format `0.00` |

### D. « Liste des indicateurs » (List of indicators) — module 9, slick grid

| column | width | content |
|---|---|---|
| **Name** | 210 | `indicator` — the indicator name |
| **Indicator** | 345 | `gradient`, `forceType: gradient`, renderer options `{domain:[0,14], stopType:'values'}` — a colour bar rendered across pH 0→14 showing exactly where the indicator turns and into which colours |

Filterable header row; read-only.

### E. Error count — module 8 (hidden on the student layer)

Displays `errorCount`: the number of titration points at which the Newton–Raphson solver failed to converge. Font 18 pt.

### F. Debug inspectors (Twig layer only)

Modules 12 and 13: expandable object editors, read-only, with search, on `mouseTracking` and `result` respectively.

## 1.5 The chemistry / JS logic, module by module

### Module 4 — build the form schema (`execOnLoad`, libs: lodash, ChemEquilibrium)

```
helper = new ChemEquilibrium.Helper()
species = helper.getSpecies({type: 'acidoBasic'});  species.sort()
schema = { solution: {type∈species default 'CO3--', concentration default 0.1, volume default 20},
           titrationSolution: {type∈species default 'HCl', concentration 0.1, volume 50} }
API.createData('schema', schema)
```

### Module 1 — the titration computation (re-runs whenever `form` changes; libs: ChemEquilibrium)

```
form = deep copy of API.getData('form')
form.solution.volume         /= 1000      // mL → L
form.titrationSolution.volume/= 1000      // mL → L
form.chunks = 500                          // 501 points computed
helper = new ChemEquilibrium.Helper()      // fresh, whole database
serie  = new ChemEquilibrium.Serie(helper)
result = serie.getTitration(form)
result.speciesNew = result.species.map(s => s.replace(/(-+)/, '($1)'))   // 'CO3--' → 'CO3(--)' for the mf renderer
createData: result, equations = result.equations, xy = result.xy, errorCount = result.errorCount
```

**What `Serie.getTitration(options)` does** (src/helpers/Serie.js) — the actual algorithm:

1. Clone the helper, `resetSpecies()` (leaves only the solvent `H2O`), merge `options` into the helper options.
2. `solQty = solution.concentration × solution.volume` (moles of analyte, constant throughout).
3. `helper.addSpecie(solution.type)` and `helper.addSpecie(titrationSolution.type)` — this restricts the equation set to those two species plus water and everything reachable from them.
4. For `i = 0 … chunks` (501 points):
   - `vol = titrVolStop × i/chunks` (litres of titrant added)
   - `totalVol = vol + solVolume`
   - `titrQty = vol × titrConc`
   - `helper.setTotal(titrant, titrQty)`, `helper.setTotal(analyte, solQty)`, `helper.setOptions({volume: totalVol})`
   - `eq = helper.getEquilibrium()` → builds the numerical model
   - if a previous solution exists: `eq.setInitial(previousSolution); sol = eq.solve()` (warm start, cheap); otherwise `sol = eq.solveRobust()` (up to `robustMaxTries = 10` random log-distributed restarts)
   - if converged: push `pH = -log10(sol['H+'])`, the full solution object, and `vol`; else `errorCount++` and that point is simply **omitted** from the curve.
5. Returns `{ xy (flat [v0,pH0,v1,pH1,…]), errorCount, solutions, species, volumes, equations }`.

**The underlying equilibrium solve** (`Equilibrium` + `newtonRaphton`):

- The equation set is *normalized*: every equation is rewritten in terms of independent components only (`EquationSet.getNormalized(solvent)`), summing pK values along substitution chains — so e.g. `H2CO3` is expressed directly from `CO3--` and `2 H+` with pK 10.33 + 6.30 = 16.63.
- `getModel()` produces `components[]` (with `total` in moles) and `formedSpecies[]` (with `beta = 10**pK` and a stoichiometric coefficient vector).
- `Equilibrium._processModel` builds the stoichiometry matrix, converts totals to **concentrations** by dividing by `options.volume`, and folds any `atEquilibrium`-fixed component into the betas (`newBeta = oldBeta × fixed^stoich`).
- `newtonRaphton(model, beta, cTotal, c0, …)` iterates Newton–Raphson on the mass-balance residuals with a Jacobian from `ml-matrix`, defaults `tolerance = 1e-15`, `solidTolerance = 1e-5`, `maxIterations = 99`. Initial guesses are drawn as `random()**10` (logarithmically distributed over [0,1]).
- The titration script passes no tuning options, so all defaults apply.
- Results are **molar concentrations** of every species, keyed by label. `pH = -log10([H+])`.

Water is always present: `H2O ⇄ OH- + H+`, pK 14 → Kw = 1e-14.

### Module 6 — load the indicator dataset (`execOnLoad`; libs: superagent, papaparse, lodash, `src/util/colorbar`)

```
API.createData('indicatorTable', [])
GET https://googledocs.cheminfo.org/spreadsheets/d/1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU/export?format=tsv
Papa.parse(text, {delitmiter:'\t', header:true, dynamicTyping:true})       // note: 'delitmiter' is a typo, harmless
sort rows ascending by pH1
grouped = _.groupBy(rows, r => r.name)                                     // merges the 2 transitions of polychromic indicators
indicators = ['none'].concat(Object.keys(grouped))
API.cache('groupedIndicators', grouped)
API.createData('indicSchema', {indicator: {enum: indicators, label:'Indicateurs', default:'none'}})   // legacy, unused
for each indicator:
    gradient = { domain:[0,14], stopType:'values',
                 stopPositions:[pH1a,pH2a, pH1b,pH2b, …],
                 stops:[color1a,color2a, color1b,color2b, …] }
    scale = ColorBar.getColorScale(gradient)
    el.color = 200 sampled {color, value} entries across pH 0–14
    el.indicator = name;  el.gradient = gradient
API.createData('indicatorTable', indicatorTable)
```

`el.color` is computed but never consumed downstream; the grid renders `el.gradient` only. (There is also an arithmetic slip in it: `value: phFrom + phTo / 2` instead of `(phFrom+phTo)/2` — harmless because the field is unused.)

### Module 7 — indicator colouring (fires on `indicator` **and** on `mouseTracking`; lib `src/util/colorbar`)

```
if indicator == 'none': colorAnnotations = [];  trackColor = 'white';  return
rebuild the {domain:[0,14], stopPositions, stops, stopType:'values'} scale from cache('groupedIndicators')
if the triggering variable was 'mouseTracking':
    trackColor = scale(mouseTracking.xy.interpolatedY)     // interpolatedY is the pH under the cursor
    return
else:  // rebuild the graph overlay
    x1 = 0, x2 = form.titrationSolution.volume   (fallback "60px"/"70px" if no form yet)
    for i in 0..99:  band from pH 14i/100 to 14(i+1)/100, colour = scale(midpoint pH)
       push {type:'rect', position:[{x:x1,y:phFrom},{x:x2,y:phTo}], fillColor, fillOpacity:0.5, strokeWidth:0}
    API.createData('colorAnnotations', annotations)
```

Quirk worth knowing: `x2` is taken from the **shared** `form` (still in mL, e.g. 50), whereas the graph x-axis is in litres (0 → 0.05) — module 1 does the ÷1000 on a private deep copy. The bands therefore extend far past the right edge, which happens to look correct.

### Module 15 — toolbar action handler (libs: file-saver)

- action **`clearColor`** → `API.createData('colorAnnotations', undefined)` (removes the indicator overlay).
- action **`exportTSV`** → reads `xy`, writes `volume\tpH` header plus one line per point, saves as a text blob named **`curve.csv`** (tab-delimited despite the extension).

### Module 3 — ONDE form

`mode: schema`, `schemaSource: variable` (uses the `schema` variable from module 4). Its inline fallback schema is legacy and shows an older UI (a two-choice titrant `["acide (HCl)","base(NaOH)"]`, volumes in L) — not what runs.

## 1.6 The embedded indicator dataset (21 indicators, 25 transitions)

Loaded at runtime, not embedded in the JSON. **Source:** `https://googledocs.cheminfo.org/spreadsheets/d/1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU/export?format=tsv` (spreadsheet id `1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU`). Columns: `Indicateur6 | name | pH1 | pH2 | color1 | color2`.

| Indicator (FR) | English | pH range(s) | acid colour → base colour |
|---|---|---|---|
| Bleu de bromothymol (BBT) | Bromothymol blue (BTB) | 0–0 *(degenerate row)*; 6–7.6 | `#ff0088`→`yellow`; `yellow`→`#0033FF` |
| Rouge de crésol | Cresol red | 0–1; 7.2–8.8 | `red`→`yellow`; `yellow`→`red` |
| Violet de gentiane | Gentian / crystal violet | 0–1.6 | `yellow`→`#b516e9` |
| Vert malachite | Malachite green | 0.2–1.8; 11.5–13.2 | `yellow`→`#00AAAA`; `#00AAAA`→`white` |
| Bleu de thymol | Thymol blue | 1.2–2.8; 8–9.6 | `red`→`yellow`; `yellow`→`blue` |
| Jaune de méthyle | Methyl yellow | 2.9–4 | `red`→`yellow` |
| Bleu de bromophénol (BBP) | Bromophenol blue (BPB) | 3–4.6 | `yellow`→`violet` |
| Rouge Congo | Congo red | 3–5.2 | `blue`→`red` |
| Hélianthine (Méthyl orange) | Methyl orange | 3.1–4.4 | `red`→`yellow` |
| Hélianthine en solution dans le xylène cyanole | Screened methyl orange (with xylene cyanol) | 3.2–4.2 | `fuchsia`→`lime` |
| Vert de bromocrésol | Bromocresol green | 3.8–5.4 | `yellow`→`#0033FF` |
| Rouge de méthyle | Methyl red | 4.2–6.3 | `red`→`yellow` |
| Papier de tournesol (Azolitmine) | Litmus paper (azolitmin) | 4.5–8.3 | `red`→`blue` |
| Pourpre de bromocrésol | Bromocresol purple | 5.2–6.8 | `yellow`→`violet` |
| Rouge de phénol (Phénolsulfonephtaléine) | Phenol red (phenolsulfonephthalein) | 6.6–8 | `yellow`→`red` |
| Rouge neutre | Neutral red | 6.8–8 | `red`→`#FFCC00` |
| Phénolphtaléine | Phenolphthalein | 8.2–10 | `white`→`pink` |
| Thymolphtaléine | Thymolphthalein | 9.4–10.6 | `white`→`blue` |
| Jaune d'alizarine R | Alizarin yellow R | 10.1–12 | `yellow`→`#FF3300` |
| Alizarine | Alizarin | 11–12.4 | `red`→`violet` |
| Carmin d'indigo | Indigo carmine | 11.4–13 | `blue`→`yellow` |

Plus the synthetic entry **`none`** ("no indicator") prepended by the loader.

---

# TOOL 2 — `view-acidbase.json` — « Equilibres acide/base »

*(Acid/base equilibria)* — 9 modules, 2 layers (`Default layer` = student view, `Admin`).

Aliases: `ChemEquilibrium` → `chem-equilibrium/2.2.1/chem-equilibrium.min`; `ChemEquilibriumXX` → `http://localhost:9898/…` (developer override, unused); `vh` → `visualizer-helper` pinned at commit `6ff40d127c7788abcff45ef7abbd7871b24ff71f`.

## 2.1 Purpose / pedagogic scenario

Build a **speciation (distribution) diagram**: given an arbitrary mixture of acids and bases at chosen concentrations, plot the equilibrium concentration of **every** species as a function of pH, over pH 0 → 14. The student:

1. ticks any subset of the 71 acid/base species (« Espèces »);
2. sets each one's initial amount (« Quantitées initiales »);
3. inspects the acidity constants the model automatically pulled in (« Constantes d'acidité utilisées »), and can **switch individual equilibria off** with an `Ignore` checkbox — the pedagogic point being to see what a given equilibrium actually contributes;
4. hits *Generate*, and reads the multi-series log/linear speciation plot;
5. hovers a pH and reads the exact concentration and −log₁₀ concentration of every species at that pH.

Selections and quantities are **persisted in `localStorage`** so the session survives a reload.

## 2.2 Modules and layout (Default layer = student view)

| id | type | Title (FR) | English | role |
|---|---|---|---|---|
| 2 | `edition/slick_grid` | **Espèces** | Species | multi-select checkbox list of all 71 acid/base species |
| 7 | `edition/slick_grid` | **Quantitées initiales** *(sic — should be "Quantités")* | Initial amounts | editable amount per selected species |
| 3 | `edition/slick_grid` | **Constantes d'acidité utilisées** | Acidity constants used | equation table with pK and an `Ignore` toggle |
| 5 | `spectra_displayer` | *(untitled)* | speciation chart | bottom, full width |
| 8 | `display/template-twig` | *(untitled)* | tracking readout table | bottom-right |
| 6 | `display/single_value` | *(untitled)* | `Number of errors: %s` | small strip |
| 4 | `code_executor` | Compute equilibriums | (button **Generate**) | small |

Admin layer only: `1` (Create the equation table and the onde schema), `4`, `9` (Slick script).

## 2.3 `init_script` (runs once, at view load)

```
[trackArray, track, ChemEquilibrium] = await API.require(['vh/util/trackArray','vh/util/track','ChemEquilibrium'])

trackArray('chem-equilibrium-acid-base-species', [], entry => entry.specie, {varName: 'specieSelection'})
track('chem-equilibrium-config', {}, {varName: 'config'})

API.onAction('speciesLoaded', () => {
    data = JSON.parse(localStorage['chem-equilibrium-acid-base-species'])
    API.doAction('selectSpecies', row => data.find(d => String(d.label) === String(row.label)))
})

helper = new ChemEquilibrium.Helper()
API.createData('allSpecies', helper.getSpecies({type:'acidoBasic'}).map(label => ({label, qty: 1})))
API.cache('helper', helper)
```

So: `specieSelection` is mirrored to `localStorage` under `chem-equilibrium-acid-base-species`; when the species grid finishes loading it fires `speciesLoaded`, and the previously ticked rows are re-selected. `allSpecies` is the 71 species (**unsorted** here, unlike the titration tool) each with default `qty = 1`. The `config` variable is tracked but never read by the compute module.

## 2.4 Every user input

### « Espèces » (Species) — module 2

- Slick grid over `allSpecies`; flags: `enableCellNavigation, rowNumbering, forceFitColumns, highlightScroll, editable, autoEdit, filterColumns, keepSelected`; **`autoColumns: ['select']`** adds the checkbox column; selection model `row`; extra jpath `qty` carried along.
- Single visible column **Label**, rendered with `forceType: 'mf'` (proper molecular-formula typesetting).
- A filter header row allows text-filtering the 71 species.
- Toolbar: **Clear selected** (fa-eraser) → actionscript `clearSelected` = `API.doAction('selectSpecies', [])`.
- Its filter script comes from module 9 (`slickScript`, a JS code editor on the Admin layer):

```js
if (this.event === 'rowsSelected') {
    rows = JSON.parse(localStorage['chem-equilibrium-acid-base-species'])  // [] on parse failure
    API.createData('specieSelection', this.rows.map(row => {
        obj = {label: String(row.item.label)}
        r = rows.find(r => r.label === obj.label)
        obj.qty = r ? r.qty : row.item.qty     // reuse the stored quantity, else the default 1
        return obj
    }))
}
```

### « Quantitées initiales » (Initial amounts) — module 7

Grid over `specieSelection`.

| column (FR) | English | jpath | editor | default |
|---|---|---|---|---|
| **Espèce** | Species | `label` | read-only, `mf` renderer | — |
| **Quantitée (mol/L)** | Amount / concentration (mol/L) | `qty` | **number, auto-edit** | **1** |

Editing a value mutates `specieSelection`, which re-triggers module 1 → module 4.

### « Constantes d'acidité utilisées » (Acidity constants used) — module 3

Grid over `equations`.

| column | jpath | renderer / editor |
|---|---|---|
| **Equation** (w 158) | `chemEq` | Twig: `{{rendertype(formed,"mf")}} ⇄ <components, coefficients when ≠1, joined by +>` |
| **pK** | `chemEq.pK` | `toPrecision: 4`, read-only |
| **Ignore** | `disabled` | **boolean editor (checkbox), auto-edit** |

Filter script: `if (this.event === 'cellChanged' && this.column.id === 'Ignore') API.doAction('equationToggled')` — ticking *Ignore* re-runs module 1 with that equilibrium disabled. Also emits `clickedEq` on select and `eqDeleted` on row delete (both unconsumed).

### Other controls

- **Generate** button on module 4 (also invoked automatically via the `trigger` action from module 1).
- **Graph hover** (module 5, tracking on x) → `trackingData`. Zoom is **disabled** (`zoom: 'none'`); legend at the **bottom**, series hideable and selectable.
- **Copy data** on the graph toolbar (fa-copy) → actionscript `CopyData`: shows `API.getData('table')` inside an 800×600 `UI.dialog` `<textarea>` titled *Tab-delimited values*.
- `help` actionscript exists (Google Doc `1Xc7jneTG4IumAyiNCU7NByBu_8-x-RT50mgwmSvUPV0`) but **no module triggers it** in this view — legacy.

## 2.5 The chemistry / JS logic

### Module 1 — "Create the equation table and the onde schema" (fires on `specieSelection` change and on the `equationToggled` action; lib ChemEquilibrium)

```
species = get('specieSelection') || []
helper  = API.cache('helper')                              // the shared, persistent Helper

localStorage['chem-equilibrium-acid-base-species'] = JSON.stringify(species)
helper.resetSpecies()                                       // back to solvent H2O only
for each specie: helper.addSpecie(String(specie.label), Number(specie.qty))

for each existing row e of API.getData('equations'):
    if (e.disabled)  helper.disableEquation(String(e.chemEq.formed))
    else             helper.enableEquation(String(e.chemEq.formed))

chemEq       = helper.getEquations({filtered:true, includeDisabled:true})
normalizedEq = helper.getEquations({filtered:true, normalized:true, includeDisabled:true})
API.createData('equations', chemEq.map((eq,i) => ({chemEq: eq, normalizedEq: normalizedEq[i], disabled: !!eq.disabled})))
API.doAction('trigger')                                     // → module 4
```

`filtered: true` means `EquationSet.getSubset(selectedSpecies)`: the closure of every equation reachable from the selected species (recursively pulling in the components those equations introduce, then adding any equation all of whose components are already present). `normalized: true` additionally rewrites each equation in terms of independent components only, with pK values summed along substitution chains — that is the `normalizedEq` shown for reference.

Equations are keyed by `btoa(formed)`; disabling is by *formed species name*.

### Module 4 — "Compute equilibriums" (action `trigger` or the Generate button; libs ChemEquilibrium, `vh/ChemEquilibrium/chart`, `vh/ChemEquilibrium/table`, `src/util/ui`)

```js
config = {
  varying: 'H+',   isFixed: true,
  from: 0, to: 14, log: true,
  tolerance: 1e-15, solidTolerance: 0.00001, maxIterations: 100, chunks: 200
};
helper = API.cache('helper');
serie  = new ChemEquilibrium.Serie(helper);
sol    = serie.getSolutions(config);

API.createData('table', getTable(sol));
chart = Chart.getChart(sol.x, sol.solutions, {xLabel: …, yLabel: 'Amount of other species at equilibrium [mol]'});
API.createData('errorCount', sol.errorCount);
API.createData('chartSpecies', sol.species.map(s => s.replace(/(-+)/,'($1)')));   // for the mf renderer
API.createData('chart', chart);
API.createData('model', helper.getModel());                                       // debug, unconsumed
```

**`Serie.getSolutions(config)` algorithm** (src/helpers/Serie.js):

1. Clone the helper and merge the options (note: unlike `getTitration`, species are **not** reset — the selection made in module 1 persists).
2. Validate: `to > from`, `varying` defined.
3. For `i = 0 … 200` (201 points):
   - `val = from + (to−from)·i/chunks` — here `val` is literally the **pH**, 0 → 14 in steps of 0.07;
   - `realVal = 10**(−val)` because `log: true` — the molar `[H+]`;
   - because `isFixed: true`, call `helper.setAtEquilibrium('H+', realVal)` — H⁺ is **pinned** at equilibrium (a perfectly buffered solution) rather than being mass-balanced;
   - `eq = helper.getEquilibrium()`; warm-start with the previous solution and `eq.solve()`, or `eq.solveRobust()` on the first point;
   - on success push `val` (pH) and the solution object; else `errorCount++` and skip the point.
4. Return `{x, solutions, errorCount, species}`.

Internally, `Equilibrium._processModel` folds the fixed H⁺ into the formation constants (`newBeta = beta × [H+]^stoich`) and removes it from the Newton–Raphson unknowns; the remaining mass balances are solved to `tolerance = 1e-15`, up to `maxIterations = 100`, initial guesses `random()**10`. `options.volume` is never set here, so it stays at the default **1** — meaning the "quantities" the student types behave directly as molar concentrations.

**`vh/ChemEquilibrium/chart.getChart(x, y, options)`**:

```js
species = Object.keys(y[0]);
colors  = Color.getDistinctColors(species.length);       // one distinct colour per species
chart = { data: [], axis: [{label: xLabel}, {label: yLabel}] };
for each specie i:  data.push({ x, y: y.map(s => s[species[i]]), label: species[i],
                                xAxis: 0, yAxis: 1,
                                defaultStyle: {lineColor: colors[i], lineWidth: 1} });
```

**`vh/ChemEquilibrium/table.getTable(sol)`**: builds a CRLF-joined TSV, header `x\t<species…>`, one row per pH point with each species' concentration. That is what *Copy data* shows.

## 2.6 Every output panel

### A. Speciation chart — module 5

- **Series**: one line per species, from the `chart` variable; distinct auto-generated colours; stroke width 2 (module override); legend at the bottom, series hideable/selectable; tracking on x.
- **X axis**: pH, 0 → 14 (201 points). *Label is empty at runtime* — the script's `xLabel` expression `('Quantity ' + … + 'at equilibrium ' + config.log ? '' : '[mol]')` has an operator-precedence bug: the ternary consumes the whole concatenation, which is always truthy, so it evaluates to `''`.
- **Y axis**: label **`Amount of other species at equilibrium [mol]`** — in practice these are molar concentrations, since `volume` defaults to 1. Linear scale, auto min/max (so minor species are visually crushed; the numeric readout below is where they are read).

### B. Tracking readout — module 8, Twig

Inputs `trackingData` (per-series interpolated y at the hovered pH) and `chartSpecies`.

| Specie | `[]` | `-log10[]` |
|---|---|---|
| `chartSpecies[loop.index-1]` via the `mf` renderer | `value.interpolatedY`, `toPrecision: 4` | `-log10(interpolatedY)`, `toPrecision: 4` |

Font 18 px.

### C. Error counter — module 6

`single_value` with `sprintf: 'Number of errors: %s'` over `errorCount` — the number of the 201 pH points where Newton–Raphson failed to converge (those points are silently absent from the curves).

### D. « Constantes d'acidité utilisées » — see 2.4; it is both an input and an output (the *pK* column is what the model uses).

## 2.7 Embedded chemistry dataset

Not embedded in the view — it comes from `data/data.json` of the `chem-equilibrium` package (125 entries total: 39 `acidoBasic`, 47 `complexation`, 39 `precipitation`; these two tools filter to `acidoBasic` only). Full dump in `extracted-acidbase.json`. Convention: `pK` is log₁₀ of the **formation** constant of `formed` from its `components`, so `beta = 10**pK`; for a monoprotic couple it equals the pKa. Sorted by pK:

`HClO4 −7 · HCl −3 · H2SO4 −3 · HNO3 −1 · HIO3 0.8 · H3PO3 1.26 · H2SO3 1.8 · HSO4- 1.9 · HClO2 1.93 · Fe(H2O)6+++ 2.1 · H3PO4 2.12 · CH2ClCO2H 2.89 · HF 3.2 · HNO2 3.35 · HOCN 3.48 · HCO2H 3.75 · C6H5COOH 4.2 · C6H5NH3+ 4.6 · CH3CO2H 4.7 · C2H5COOH 4.87 · Al(H2O)6+++ 4.9 · C5H5NH+ 5.25 · H2CO3 6.3 · H2PO3- 6.7 · H2S 7.04 · H2PO4- 7.2 · HSO3- 7.21 · HClO 7.4 · HBrO 8.6 · HCN 9.2 · NH4+ 9.25 · HCO3- 10.33 · CH3NH3+ 10.66 · (C2H5)3NH+ 10.75 · C2H5NH3+ 10.8 · HPO4-- 12.32 · H2O 14 · HS- 19 · NH3 23`

`H2O ⇄ OH- + H+` (pK 14, i.e. Kw = 1e-14) is always present as the solvent equilibrium in both tools.

---

# French → English label glossary (both tools)

| French | English |
|---|---|
| Démonstration titrage acide / base | Acid/base titration demonstration |
| Equilibres acide/base | Acid/base equilibria |
| Courbe de titration | Titration curve |
| Préférences | Preferences / Settings |
| Données calculées | Computed data |
| Liste des indicateurs | List of indicators |
| Indicateurs | Indicators |
| Couple(s) acide-base en jeu | Acid–base couple(s) involved |
| Constantes d'acidité utilisées | Acidity constants used |
| Espèces / Espèce | Species |
| Quantitées initiales *(sic)* | Initial amounts |
| Quantitée (mol/L) *(sic)* | Amount / concentration (mol/L) |
| Solution à titrer | Solution to be titrated (analyte) |
| Solution de titration | Titrant solution |
| Acide / Base | Acid / Base |
| Concentration (mol/L) / Volume (mL) | (identical) |
| Volume ajouté / Volume total | Volume added / Total volume |
| Couleur indicateur | Indicator colour |
| Ignore, Help, Execute, Generate, Export, Clear indicator, Clear selected, Copy data, Export as tab-delimited, Error count | already English |

# Notable defects found while reading the scripts

1. **`view-titration` module 7**: the indicator overlay's `x2` is read from the shared `form` in **mL** while the graph x-axis is in **L** (module 1 converts only a private copy) — the bands over-extend by 1000×.
2. **`view-acidbase` module 4**: the `xLabel` ternary has an operator-precedence bug, so the x axis (pH) is always unlabelled.
3. **`view-titration` module 6**: `annotations.push({value: phFrom + phTo / 2})` should be `(phFrom + phTo) / 2`; also `delitmiter` is misspelled in the Papa.parse options. Both are inert (the field/option is unused).
4. **`view-acidbase`**: the chart y-label says `[mol]` while the readout table says `[]`/`-log10[]`; because `volume` defaults to 1 these coincide numerically, but the units labelling is inconsistent.
5. **Indicator sheet**: the first Bromothymol-blue row has `pH1 = pH2 = 0`, a degenerate zero-width transition.
6. **Dead artefacts**: `indicSchema` (titration), the inline legacy ONDE schema on module 3 (titration), the `help` actionscript and the `config` tracked variable (acidbase), `API.createData('model', …)` (acidbase), and `clickedEq` / `eqDeleted` outputs (acidbase) are all produced but never consumed.