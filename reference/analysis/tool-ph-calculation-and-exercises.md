Extracted datasets written to:
- `/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-calcul-ph.json`
- `/private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/extracted-exercices-ph.json`

---

# TOOL 1 — «Calcul du pH d'une solution» (calcul-ph)

**English title:** *Calculating the pH of a solution*. Visualizer version 2.147.1. Library alias: `ChemEquilibrium` → `../../lib/chem-equilibrium/2.2.0/chem-equilibrium.min`.

## 1. Purpose and pedagogic scenario

A single-screen "pH calculator" for a first-year acid–base course. The student (a) types a molar concentration, (b) picks an acid (or any conjugate acid form, including polyprotic intermediates) from a colour-banded, searchable list of 40 acid/base couples, and immediately sees: the pH, the list of equilibria the solver actually used, and the full table of equilibrium concentrations. The colour banding of the list is the pedagogic device: it shows at a glance where the couple sits relative to the water levelling window (strong acid / weak acid / pKa≈7 / weak acid with basic conjugate / very weak acid = strong base). The tool is *exact* (numerical equilibrium solution), so it is the counterpart to the simplified formulas drilled in Tool 2.

## 2. Layout (Default/student layer — 4 visible modules)

| Module | Type | Position/size (grid units, 10px) | Role |
|---|---|---|---|
| id 3 | `display/template-twig` — "Préférences pour le calcul" (*Preferences for the calculation*) | (0,0) 54×63 | Instructions + concentration input + pKa chart image |
| id 9 | `array_search/smart_array_filter` — "Recherche d'un acide" (*Search for an acid*) | (55,0) 40×7 | Keyword search over the acid database |
| id 6 | `edition/slick_grid` — "Cliquez pour choisir l'acide" (*Click to choose the acid*) | (55,8) 40×55 | Colour-banded acid list, click = select |
| id 7 | `display/template-twig` (no title) | (96,8) 42×55 | Results panel |

Hidden/admin modules: id 1 (compute code-executor), id 10 (row-click code-executor), id 2 (grid of equations used, layer title "Couple(s) acide-base en jeu" = *Acid–base couple(s) involved*), id 4 & 8 (`code_editor` holding the two HTML templates), id 5 (`object_editor` "Database of pKa"), id 11 + 12 (Data-layer grid + object editor for editing the database subset).

Data-flow graph:

```
init_script ──► preferences {solution:{type:'CH3CO2H', concentration:0.1}}
object_editor(5) ──data──► smart_array_filter(9) ──filteredData──► slick_grid(6)
slick_grid(6) ──onRowActive: selectedEquilibrium──► code_executor(10)
   └► preferences.solution.type = selectedEquilibrium.formed; preferences.triggerChange()
preferences ──► code_executor(1)  [ChemEquilibrium]  ──► result, equations, xy, errorCount
result + preferences + resultTemplate ──► template-twig(7)   (the result panel)
templateForm + preferences(form) ──► template-twig(3)        (the input form)
```

## 3. Every input

**a) Concentration field** — in the `templateForm` HTML (module 4), bound two-way to `preferences.solution.concentration`:
```html
Concentration: <input type="number" min="0" max="6" step="any" name="solution.concentration" style="width: 120px"> M
```
`min=0`, `max=6`, `step=any`, initial value `0.1`. The twig module is `modifyInForm: yes`, `debouncing: 250 ms`, `keepFormValueIfDataUndefined` — so every keystroke (after 250 ms) re-triggers the whole calculation.

**b) Acid search box** (`smart_array_filter`, module 9) — placeholder **"Introduire un mot-clef"** (*Enter a keyword*); `debounce: 100 ms`, `limit: 0` (unlimited), `predicate: AND`, `caseInsensitive`. Free-text keyword search across the whole database record (formula, conjugate base, pK). Output → `filteredData`.

**c) Acid list** (`slick_grid`, module 6) — columns **Equilibrium** (twig-rendered `formed ⇄ Σ components` with `rendertype(..., "mf")` molecular-formula rendering) and **pK**. `rowHeight: 30`, `selectionModel: row`, `forgetLastActive`, `forceFitColumns`, row background from the `color` jpath. Clicking a row emits `onRowActive → selectedEquilibrium`, which module 10 turns into `preferences.solution.type`.

**d) (Data layer only)** the raw pKa database is editable through `object_editor` (module 5) and a second grid+editor pair (11/12) for building subsets.

## 4. The computation (module 1, `code_executor`, lib `ChemEquilibrium`)

Verbatim script:

```js
const preferences = API.getData('preferences').resurrect();
preferences.solution.volume = 1; // 10 mL
preferences.titrationSolution = { type: '', volume: 0 }
preferences.chunks = 1;
console.log(preferences)
const database = API.getData('data').resurrect();
const helper = new ChemEquilibrium.Helper({database});
const serie = new ChemEquilibrium.Serie(helper);
const result = serie.getTitration(preferences);
result.equations = result.equations.filter( equation => equation.formed!=='H2O');
result.initial = [];
for (let key in result.solutions[0]) {
    const concentration = ({
        species: key,
        concentration: result.solutions[0][key],
        pConcentration: -Math.log10(result.solutions[0][key]),
    })
    result.initial.push(concentration);
    if (key==="H+") { result.pH = concentration; }
}
API.createData('result', result);
API.createData('equations', result.equations);
API.createData('xy', result.xy);
API.createData('errorCount', result.errorCount);
```

Plain algorithmic description:

1. Copy `preferences`; force `solution.volume = 1` L (the `// 10 mL` comment is stale), an **empty titrant** (`titrationSolution = {type:'', volume:0}`) and `chunks = 1`. The tool therefore abuses the *titration* API to compute a single static solution — with `titrVolStop = 0` the loop runs twice at volume 0 and yields two identical solutions; only `solutions[0]` is read.
2. `new ChemEquilibrium.Helper({database})` — the **view's own 40-equation database replaces the packaged one** (no `extend` flag). Consequence, verified by running the real library: **there is no H₂O autoprotolysis equation in the model**; `OH-` never appears and `[H+]` comes only from the acid mass balance. The `filter(equation => equation.formed !== 'H2O')` line is defensive left-over from the default database.
3. `new ChemEquilibrium.Serie(helper).getTitration(preferences)` — inside the library: clone helper → `resetSpecies()` → `addSpecie(solution.type)` → `setTotal(type, concentration × volume)` → `helper.getEquilibrium()` → `EquationSet.getSubset()` pulls in the **whole protonation ladder** reachable from the chosen species → `getNormalized('H2O')` → `getModel()` (β = 10^pK) → `Equilibrium.solveRobust()` (Newton–Raphson, up to `robustMaxTries: 10` random log-uniform restarts, `tolerance: 1e-15`).
4. Post-process: build `result.initial`, one row per species, with `concentration` and `pConcentration = -log10(concentration)`; the `H+` row is also stored as `result.pH`.
5. Publish `result`, `equations` (grid module 2), `xy`, `errorCount`.

**chem-equilibrium calls used:** `new ChemEquilibrium.Helper({database})`, `new ChemEquilibrium.Serie(helper)`, `serie.getTitration(options)`. Internally that reaches `Helper.clone/resetSpecies/setOptions/addSpecie/setTotal/getEquilibrium/getEquations({filtered:true})`, `EquationSet.getSubset/getNormalized/getModel`, `Equilibrium.solveRobust/solve/setInitial`.

Verified outputs (running the real `src/` against this database, C = 0.1 M):

| Selected | Equations pulled in | pH | Notes |
|---|---|---|---|
| CH3CO2H | CH3CO2H (4.7) | **2.853** | matches the simplified 4.7/2 + 0.5 = 2.85 |
| HCl | HCl (−2.2) | **1.000** | |
| H3PO4 | H3PO4 (2.12), H2PO4(−) (7.2), HPO4(−−) (12.32) | **1.620** | full triprotic ladder auto-added |
| H2PO4(−) | H2PO4(−), HPO4(−−), H3PO4 | **4.676** | amphoteric |
| NH4+ | NH4+ (9.25), NH3 (23) | **5.125** | |
| H2SO4 | H2SO4 (−3), HSO4(−) (1.9) | **0.958** | |

Caveat to note in any port: because water is absent from the model, very dilute or very weak acids give unphysical results (e.g. HS(−) 0.1 M → pH 13.02, and 10⁻⁹ M HCl → pH 9).

## 5. Every output

### 5a. Input panel (module 4 template, French → English)

> **"Cet outil permet la détermination du pH d'une solution d'une concentration connue."** → *This tool determines the pH of a solution of known concentration.*
> **"Afin de faire les calculs il est nécessaire de:"** → *In order to do the calculations you need to:*
> 1. **"Introduire la concentration de la solution (en mole/L, molaire)"** → *Enter the concentration of the solution (in mol/L, molar)*
> 2. **"Choisir dans la liste à droite l'acide souhaité"** → *Choose the desired acid from the list on the right*
>
> **"Concentration: [ ] M"**
> **"Quelques pKa importants pour fixer les idées"** → *Some important pKa values to get a feel for the scale* — followed by `<img src="https://couch.cheminfo.org/cheminfo-public/e71d251b9aee436715c821706dab07bd/upload/pk.png">`

Styling: `#inputForm { zoom: 1.5 }`, `h1 { font-size: 1em }`.

### 5b. Result panel (module 8 template → module 7)

- **`<h1>` "Résultats du calcul"** → *Calculation results*
- **`<h2>` "pH d'une solution de {{mf(type)}} {{concentration}}M"** → *pH of a solution of … …M*
- **`<h2 style="color: darkred; font-size: 2em">` "pH = {{result.pH.pConcentration|number_format(2)}}"** — the headline number, 2 decimals, dark red.
- **`<h2>` "Equations utilisées pour les calculs"** → *Equations used for the calculations*; table with headers **Equation** | **pKa**, one row per `result.equations` entry, rendered `formed ⇄ base + H+` via `rendertype(..., "mf")`.
- **`<h2>` "Concentrations à l'équilibre"** → *Equilibrium concentrations*; table with headers **"Espèces"** (*Species*) | **"[ ] M"** | **"-log []"**. Concentration rendered `{toPrecision: 4}`, −log rendered `{toFixed: 2}`. One row per species in `result.solutions[0]`, including `H+` itself.

Table CSS: `border-collapse: collapse; th,td { border: 1px solid; padding: 3px }`, left-aligned headers.

### 5c. The pKa reference table with colour banding

The banding rule lives in the acid-list `filterRow` (module 6) and is applied to every row at render time — it reproduces exactly the `color` stored in the database (verified: 40/40 match):

```js
if (row.item.pK < -1.6)      row.item.color = "#fdd2d2";
else if (row.item.pK < 6.9)  row.item.color = "#fcd6ff";
else if (row.item.pK < 7.1)  row.item.color = "#d1d3ff";
else if (row.item.pK < 15.6) row.item.color = "#d0fdd4";
else                          row.item.color = "#ffffe5";
```

The thresholds are the water-levelling window (pKa(H₃O⁺) = −1.74, pKa(H₂O) = 15.74) plus a ±0.1 neutral band around 7:

| Colour | Range | Category (FR) | Category (EN) |
|---|---|---|---|
| `#fdd2d2` pale red | pKa < −1.6 | acide fort / « acide très fort », nivelé par l'eau — base conjuguée très faible (indifférente) | strong acid, levelled by water — very weak (spectator) conjugate base |
| `#fcd6ff` pale pink/mauve | −1.6 ≤ pKa < 6.9 | acide faible, domaine acide | weak acid, acidic range |
| `#d1d3ff` pale blue | 6.9 ≤ pKa < 7.1 | pKa ≈ 7, couple neutre | pKa ≈ 7, neutral couple |
| `#d0fdd4` pale green | 7.1 ≤ pKa < 15.6 | acide faible, domaine basique — base conjuguée notable | weak acid, basic range — appreciably basic conjugate base |
| `#ffffe5` pale yellow | pKa ≥ 15.6 | acide très faible — base conjuguée forte, nivelée par l'eau | very weak acid — strong conjugate base, levelled by water |

**FULL 40-entry table** (in stored order; every entry has exactly one conjugate base with stoichiometric coefficient 1, `type: "acidoBasic"`):

| # | Acid | ⇄ Conjugate base + H⁺ | pKa | Colour | Category |
|---|---|---|---|---|---|
| 1 | HI | I(−) | −5.2 | `#fdd2d2` | strong |
| 2 | HBr | Br(−) | −4.7 | `#fdd2d2` | strong |
| 3 | H2SO4 | HSO4(−) | −3 | `#fdd2d2` | strong |
| 4 | HCl | Cl(−) | −2.2 | `#fdd2d2` | strong |
| 5 | HNO3 | NO3(−) | −1 | `#fcd6ff` | weak/acidic |
| 6 | HIO3 | IO3(−) | 0.8 | `#fcd6ff` | weak/acidic |
| 7 | H2SO3 | HSO3(−) | 1.8 | `#fcd6ff` | weak/acidic |
| 8 | HSO4(−) | SO4(−−) | 1.9 | `#fcd6ff` | weak/acidic |
| 9 | HClO2 | ClO2(−) | 1.93 | `#fcd6ff` | weak/acidic |
| 10 | H2PO3 | HPO3(−) | 2 | `#fcd6ff` | weak/acidic |
| 11 | Fe(H2O)6+++ | Fe(H2O)5OH++ | 2.1 | `#fcd6ff` | weak/acidic |
| 12 | H3PO4 | H2PO4(−) | 2.12 | `#fcd6ff` | weak/acidic |
| 13 | CH2ClCO2H | CH2ClCO2(−) | 2.89 | `#fcd6ff` | weak/acidic |
| 14 | HF | F(−) | 3.17 | `#fcd6ff` | weak/acidic |
| 15 | HNO2 | NO2(−) | 3.35 | `#fcd6ff` | weak/acidic |
| 16 | HOCN | OCN(−) | 3.48 | `#fcd6ff` | weak/acidic |
| 17 | HCO2H | HCO2(−) | 3.75 | `#fcd6ff` | weak/acidic |
| 18 | C6H5COOH | C6H5COO(−) | 4.2 | `#fcd6ff` | weak/acidic |
| 19 | C6H5NH3+ | C6H5NH2 | 4.6 | `#fcd6ff` | weak/acidic |
| 20 | CH3CO2H | CH3COO(−) | 4.7 | `#fcd6ff` | weak/acidic |
| 21 | C2H5COOH | C2H5COO(−) | 4.87 | `#fcd6ff` | weak/acidic |
| 22 | Al(H2O)6+++ | Al(H2O)5OH++ | 4.9 | `#fcd6ff` | weak/acidic |
| 23 | C5H5NH+ | C5H5N | 5.25 | `#fcd6ff` | weak/acidic |
| 24 | H2CO3 | HCO3(−) | 6.3 | `#fcd6ff` | weak/acidic |
| 25 | HPO3(−) | PO3(−−) | 6.59 | `#fcd6ff` | weak/acidic |
| 26 | H2S | HS(−) | 7.04 | `#d1d3ff` | neutral (pKa≈7) |
| 27 | H2PO4(−) | HPO4(−−) | 7.2 | `#d0fdd4` | weak/basic |
| 28 | HSO3(−) | SO3(−−) | 7.21 | `#d0fdd4` | weak/basic |
| 29 | HClO | ClO(−) | 8 | `#d0fdd4` | weak/basic |
| 30 | HBrO | BrO(−) | 8.6 | `#d0fdd4` | weak/basic |
| 31 | HCN | CN(−) | 9.2 | `#d0fdd4` | weak/basic |
| 32 | NH4+ | NH3 | 9.25 | `#d0fdd4` | weak/basic |
| 33 | HCO3(−) | CO3(−−) | 10.33 | `#d0fdd4` | weak/basic |
| 34 | CH3NH3+ | CH3NH2 | 10.66 | `#d0fdd4` | weak/basic |
| 35 | (C2H5)3NH+ | (C2H5)3N | 10.75 | `#d0fdd4` | weak/basic |
| 36 | C2H5NH3+ | C2H5NH2 | 10.8 | `#d0fdd4` | weak/basic |
| 37 | HPO4(−−) | PO4(−−−) | 12.32 | `#d0fdd4` | weak/basic |
| 38 | HS(−) | S(−−) | 19 | `#ffffe5` | very weak acid |
| 39 | NH3 | NH2(−) | 23 | `#ffffe5` | very weak acid |
| 40 | HClO4 | ClO4(−) | −7 | `#fdd2d2` | strong (appended out of order) |

Note the database is **not** sorted: `HClO4` (pKa −7) sits last, appended after the original sorted block. The textual category names ("acide très fort", "base très faible", …) exist only inside the external `pk.png` bitmap — they are not present as text anywhere in the view; the five colour bands above are the machine-readable equivalent.

---

# TOOL 2 — «Exercices sur le pH» (exercices-ph)

**English title:** *pH exercises*. Heading: **"pH acides forts / acides faibles"** → *pH of strong acids / weak acids*. Aliases: `ChemEquilibrium` (2.2.0) and `vh` → `visualizer-helper@220c0d8a` (only `vh/util/track`, currently unused).

## 1. Purpose and pedagogic scenario

A 20-question randomly generated drill on the **two simplified pH formulas**. For each question the student is shown an acid, its dissociation equation and its pKa, plus a concentration. They must (1) decide strong vs weak, (2) apply the right closed-form formula, (3) type the pH. Grading is instantaneous and purely by row colour — green when within ±0.05 of the exact value, pink otherwise. There is no hint, no solution reveal, no score, and no persistence: reloading regenerates a fresh random series.

## 2. Layout (Default/student layer — 3 visible modules)

| Module | Type | Position/size | Role |
|---|---|---|---|
| id 3 | `template-twig` "Préférences pour le calcul" | (0,0) 45×64 | Renders `templateForm` = instructions + the two formulas |
| id 10 | `slick_grid` **"Liste des exercices, cliquez pour le sélectionner"** (*List of exercises, click to select one*) | (46,0) 33×57 | The 20 exercises + grading colours |
| id 11 | `template-twig` (no title) | (83,18) 54×24 | The active question + answer input |

Module 13 (the *"Quelques pKa importants"* pk.png panel) is **`display: false` in the Default layer** — the pKa chart is not shown to the student here. Modules 1, 2, 5, 6, 7, 8, 9, 12 are Admin/Data-layer only.

Data flow:

```
object_editor(5) ──data──► code_executor(9) "Create the series of exercises" ──► exercises (20 items)
exercises ──► slick_grid(10) ──onRowActive: exercise──► template-twig(11)
template-twig(11)  (rel: tpl=exerciseTemplate, form=exercise, value=exercise, modifyInForm, debounce 500ms)
   └─ <input name="myAnswer"> writes back into exercise.myAnswer (same object as the grid row)
      └─ grid(10) filterRow re-colours the row on 'rowsChanged'
```

## 3. Every input

**a) Exercise selection** — clicking a row of `slick_grid` (module 10). Columns:

| FR header | EN | jpath | width | notes |
|---|---|---|---|---|
| **No** | No. | `index` | 68 | 1-based |
| **Solution de** | Solution of | `datum.formed` | 118 | `forceType: mf` (molecular-formula rendering) |
| **Concentration (M)** | Concentration (M) | `concentration` | 104 | |
| **Ma réponse** | My answer | `myAnswer` | 80 | |

`selectionModel: row`, `forgetLastActive`, `editable`, `forceFitColumns`, `headerRowHeight: 30`, `colorjpath: color`.

**b) Answer field** — in the question template (module 12):
```html
<input style="zoom: 1.5" type="text" name="myAnswer" placeHolder="Réponse">
```
Free text (`Réponse` = *Answer*), bound through the twig form to `exercise.myAnswer` with 500 ms debouncing.

There is **no** concentration input and **no** acid picker for the student — both are generated randomly.

## 4. Exercise generation — verbatim script (module 9)

```js
API.createData('exercises', createSeries());

/* Bug on reload ??? Some new species appear
await Track("simplePhExercises", createSeries(), { varName: "exercises" });
*/

function createSeries() {
    const data = API.getData('data');
    const nbExercises = 20;
    const concentrations = [0.01, 0.05, 0.1, 0.5, 1, 0.005, 0.001];
    const exercises = [];
    for (let i=0; i<nbExercises; i++) {
        let existing = true;
        let exercise;
        let counter=0;
        while (existing) {
            exercise = {
                index: i+1,
                datum: JSON.parse(JSON.stringify(data[(Math.random()*data.length)>>0])),
                concentration: concentrations[(Math.random()*concentrations.length)>>0],
                answer: 0,
                myAnswer: '',
            };
            exercise.key = exercise.datum.formed+" - "+exercise.concentration;
            if (! exercises.some( (existing) => existing.key===exercise.key)) {
                existing = false;
            }
            if (counter++>10) return;
        }
        setAnswer(exercise);
        exercises.push(exercise);
    }
    return exercises;
}

function setAnswer(exercise) {
    if (exercise.datum.pK < -1.7) {
        exercise.answer = - Math.log10(exercise.concentration);
    } else {
        exercise.answer = exercise.datum.pK / 2 - 0.5 * Math.log10(exercise.concentration);
    }
}
```

Algorithm:
1. Read the pKa database (`data`) — in this view a **deliberately reduced 5-acid set** (not the 40 of Tool 1).
2. Loop 20 times. Each iteration picks a uniformly random acid and a uniformly random concentration from `[0.01, 0.05, 0.1, 0.5, 1, 0.005, 0.001]`, builds the key `"<acid> - <concentration>"`, and retries while that key is already in the series (so the 20 exercises are pairwise distinct).
3. `setAnswer` — the grading value, using **only the analytic simplified formulas** (chem-equilibrium is *not* used to grade):
   - `pK < -1.7` (strong acid, below the pKa of H₃O⁺): `answer = -log10(C)`
   - otherwise (weak acid): `answer = pKa/2 - 0.5·log10(C)`
4. Publish as `exercises`.

**Known defects worth reproducing/fixing on a port:** `if (counter++>10) return;` returns from `createSeries()` entirely (yielding `undefined`, i.e. no exercises) instead of breaking the retry loop; with 35 distinct combinations and 20 required, the chance of 11 consecutive collisions on a late iteration is small but non-zero. Also `API.getData('data')` is used without `.resurrect()`. Persistence via `Track("simplePhExercises", …)` is commented out with the note *"Bug on reload ??? Some new species appear"*, so no progress is ever saved.

**Randomization summary:** acid uniform over 5, concentration uniform over 7 (note 1 M ≠ log-uniform: the list is `0.01, 0.05, 0.1, 0.5, 1, 0.005, 0.001`), 20 draws without replacement over the 35-element product set.

## 5. Answer validation — verbatim (module 10 `filterRow`)

```js
function compare(myAnswer, answer) {
    if (myAnswer==='') return;
    if (Math.abs(parseFloat(myAnswer)-parseFloat(answer))<0.05) return true;
}

if (this.event==='rowsChanged') {
    for (var i=0; i<this.rows.length; i++) {
        var row=this.rows[i];
        row.item.color = compare(row.item.myAnswer, row.item.answer) ? '#98F274' : '#FFE9E8';
    }
    rerender();
}
```

- Tolerance: **strictly less than 0.05 absolute** on the pH.
- **Correct → `#98F274`** (green row). **Wrong *or still empty* → `#FFE9E8`** (pale pink row) — unanswered rows are visually indistinguishable from wrong ones, a real UX defect to fix on a port.
- Parsing is `parseFloat`, so `"2.85 environ"` parses to 2.85 and a comma decimal (`2,85`) parses to 2 and fails.

## 6. The acid pool (5 entries only, `type: "acidoBasic"`)

| Acid | ⇄ base + H⁺ | pKa | Colour | Class (FR) | Class (EN) |
|---|---|---|---|---|---|
| HI | I(−) | −5.2 | `#fdd2d2` | acide fort | strong acid |
| HBr | Br(−) | −4.7 | `#fdd2d2` | acide fort | strong acid |
| HCl | Cl(−) | −2.2 | `#fdd2d2` | acide fort | strong acid |
| HF | F(−) | **3.2** | `#fcd6ff` | acide faible | weak acid |
| CH3CO2H | CH3COO(−) | 4.7 | `#fcd6ff` | acide faible | weak acid |

(HF is 3.2 here vs 3.17 in Tool 1 — a deliberate rounding for the exercises.)

## 7. Exercise statements — template and the complete enumeration

Question template (module 12), verbatim French with translation:

> `{% if exercise.concentration > 0 %}`
> **"Nous avons une solution {{concentration}}M de {{mf(datum.formed)}}."** → *We have a {{concentration}} M solution of {{acid}}.*
> *(yellow box)* `{{acid}} ⇄ {{base}} + H+` &nbsp;&nbsp; **"pK<sub>a</sub>: {{datum.pK}}"**
> **"Veuillez déterminer le pH de cette solution:"** → *Please determine the pH of this solution:*
> `<input name="myAnswer" placeHolder="Réponse">`
> `{% else %}` **"Veuillez cliquer sur un exercice"** → *Please click on an exercise* `{% endif %}`

Instructions panel (module 4), verbatim French with translation:

> **"pH acides forts / acides faibles"** → *pH of strong acids / weak acids*
> **"Dans cette série d'exercices vous devez calculer le pH d'une solution contenant un acide « HA » qui se trouve à une concentration donnée."** → *In this series of exercises you must calculate the pH of a solution containing an acid "HA" present at a given concentration.*
> *(yellow box)* **HA ⇄ H⁺ + A⁻**
> **"Procédure:"** → *Procedure:*
> 1. **"Déterminer si il s'agit d'un acide fort ou d'un acide faible"** → *Determine whether it is a strong acid or a weak acid*
> 2. **"Calculer le pH en utilisant la formule simplifiée correspondante"** → *Compute the pH using the corresponding simplified formula*
>
> **"Pour un acide fort"** (*For a strong acid*): `pH = - log [HA]_{init}`
> **"Pour un acide faible"** (*For a weak acid*): `pH = {pK_a - log [HA]_{init} \over 2}`
>
> (both rendered as images via `https://tex.cheminfo.org/?tex=…`)

Because the series is random, there is no fixed list of 20; the **complete space of 35 possible exercises** (each a distinct `acid – concentration` pair, with the exact grading value and the accepted ±0.05 window) is enumerated in `extracted-exercices-ph.json` → `allPossibleExercises`. Summary of expected answers:

| Acid (pKa) | 0.001 M | 0.005 M | 0.01 M | 0.05 M | 0.1 M | 0.5 M | 1 M |
|---|---|---|---|---|---|---|---|
| HI (−5.2) *strong* | 3.00 | 2.30 | 2.00 | 1.30 | 1.00 | 0.30 | 0.00 |
| HBr (−4.7) *strong* | 3.00 | 2.30 | 2.00 | 1.30 | 1.00 | 0.30 | 0.00 |
| HCl (−2.2) *strong* | 3.00 | 2.30 | 2.00 | 1.30 | 1.00 | 0.30 | 0.00 |
| HF (3.2) *weak* | 3.10 | 2.75 | 2.60 | 2.25 | 2.10 | 1.75 | 1.60 |
| CH3CO2H (4.7) *weak* | 3.85 | 3.50 | 3.35 | 3.00 | 2.85 | 2.50 | 2.35 |

Example verbatim statement (HF, 0.05 M): *«Nous avons une solution 0.05M de HF. HF ⇄ F(-) + H+  pKa: 3.2. Veuillez déterminer le pH de cette solution:»* → *"We have a 0.05 M solution of HF. HF ⇄ F⁻ + H⁺, pKa: 3.2. Please determine the pH of this solution:"* — accepted range 2.20 < answer < 2.30.

## 8. Vestigial chem-equilibrium machinery in the exercises view

Modules 1 (`code_executor` "Do calculations when preferences changes"), 2 (equations grid), 6 (row-click) and the `init_script` are **byte-identical copies of the calcul-ph tool** and still run `new ChemEquilibrium.Helper({database})` / `new ChemEquilibrium.Serie(helper).getTitration(preferences)` on the default `CH3CO2H` 0.1 M preference. Nothing in the student layer consumes `result` — the exercises are graded entirely by the closed-form formulas. A port should either drop this or repurpose it to show the *exact* pH next to the simplified one.

## 9. Consolidated French → English label glossary

| French | English |
|---|---|
| Calcul du pH d'une solution | Calculating the pH of a solution |
| Exercices sur le pH | pH exercises |
| Préférences pour le calcul | Preferences for the calculation |
| Cliquez pour choisir l'acide | Click to choose the acid |
| Recherche d'un acide | Search for an acid |
| Introduire un mot-clef | Enter a keyword |
| Couple(s) acide-base en jeu | Acid–base couple(s) involved |
| Résultats du calcul | Calculation results |
| Equations utilisées pour les calculs | Equations used for the calculations |
| Concentrations à l'équilibre | Equilibrium concentrations |
| Espèces / [ ] M / -log [] | Species / [ ] M / −log [] |
| Quelques pKa importants pour fixer les idées | Some important pKa values to get a feel for the scale |
| pH acides forts / acides faibles | pH of strong acids / weak acids |
| Liste des exercices, cliquez pour le sélectionner | List of exercises, click to select one |
| No / Solution de / Concentration (M) / Ma réponse | No. / Solution of / Concentration (M) / My answer |
| Pour un acide fort / Pour un acide faible | For a strong acid / For a weak acid |
| Veuillez déterminer le pH de cette solution | Please determine the pH of this solution |
| Veuillez cliquer sur un exercice | Please click on an exercise |
| Réponse | Answer |
| Procédure | Procedure |