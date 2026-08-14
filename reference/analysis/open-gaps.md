# Prioritized gaps — chem-equilibrium monorepo + equilibrium.cheminfo.org

Verified against the live repo, the live network, and by executing the library. Facts already in the reports are not restated.

---

## P0 — blocks starting work

**1. The monorepo shape is not addressed by any report.** The scaffold report studies two *standalone* frontend repos. All four existing workflows are root-single-package: `release.yml` runs `release-v1` with `npm: true` on the root `package.json`; `typedoc.yml` hard-codes `entry: 'src/index.js'`; `lactame.yml` publishes the UMD bundle that **all six live views load from `lactame.com/lib/chem-equilibrium/2.2.x/`** — so if the library moves to `packages/chem-equilibrium/`, the six production tools break the day the path changes, before the replacement site exists. Undecided: workspace layout, release-please manifest mode vs single package, whether the site consumes the library by workspace link or npm range, whether the JS library gets a `.d.ts` for the TS site.
→ **Closer:** decide the layout, then write `release-please-config.json` + `.release-please-manifest.json` and re-point `typedoc.yml`'s `entry` and `lactame.yml`'s build root. Nothing else can be scaffolded first.

**2. Every artifact of this research pass lives only in a session-scoped tmp dir and nothing records where the six views came from.** `/private/tmp/claude-501/…/scratchpad/` holds `view-{titration,acidbase,precipitation,free,calcul-ph,exercices-ph}.json`, all six `extracted-*.json`, `indicators-raw.tsv`, `sheet.tsv` — and it is deleted with the session. No report records the couch document id or the production URL of any of the six views, so they cannot be re-fetched, diffed, or redirected.
→ **Closer:** `mkdir -p reference && cp /private/tmp/claude-501/-Users-lpatiny-git-cheminfo-chem-equilibrium/fb7a3dc1-2711-4cea-942e-1d196da056c2/scratchpad/{view-*.json,extracted-*.json,indicators-raw.tsv,sheet.tsv} reference/ && git add reference` — and ask the user for the six live tool URLs.

**3. Three mutually contradictory pKa databases, and no report picked a canonical one.** Verified in `data/data.json`: `HCl −3`, `HF 3.2`, `HClO 7.4`, `HClO4 −7`, **`HBr` and `HI` absent**. calcul-ph's embedded 40-row DB: `HCl −2.2`, `HF 3.17`, `HClO 8`, pre-fix `H2PO3 2` / `HPO3- 6.59`, plus `HI −5.2` / `HBr −4.7`. Exercises pool: `HCl −2.2`, `HF 3.2`. The upstream sheet still holds the pre-fix phosphite chain, `HClO 8`, and `HBr`/`HI` — so `npm run database` silently reverts commit `2ad1c5b`. The exercises tool cannot even be ported to `data/data.json` as-is: 3 of its 5 acids (HI, HBr) do not exist there.
→ **Closer:** fix sheet `1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ` (phosphite chain, HClO 7.4, keep HBr/HI), then `npm run database && git diff data/data.json` — it must come back empty except for the two added rows.

**4. The pH-calculation report's central caveat is wrong and will mislead the implementer.** It claims the tool must reproduce a water-less 40-row database. I ran repo HEAD against the packaged 125-row DB (which *does* contain `H2O ⇄ OH- + H+`, pK 14): **all six of its spot values reproduce exactly** — CH3CO2H 0.1 M → **2.853**, HCl → **1.000**, H3PO4 → **1.620**, H2PO4⁻ → **4.676**, NH4⁺ → **5.125**, H2SO4 → **0.958** — while its stated pathologies vanish: HS⁻ 0.1 M → **10.020** (report: 13.02) and 10⁻⁹ M HCl → **6.998** (report: 9). There is no "keep the water-less behaviour" trade-off to weigh; the 40-row DB is pure legacy debt.
→ **Closer:** `node -e "import('/Users/lpatiny/git/cheminfo/chem-equilibrium/src/index.js').then(({Helper})=>{const h=new Helper();h.addSpecie('HS-',0.1);const s=h.getEquilibrium().solveRobust();console.log(-Math.log10(s['H+']))})"` — then delete the 40-row DB from the port plan.

---

## P1 — content that does not exist anywhere and must be authored or recovered

**5. The four help Google Docs are the only prose the six tools have, and none was extracted.** I tested all four: titration `1quyyL8y…` **200, 2371 B** (real French pedagogic prose on neutralisation + a walkthrough of every panel, with inline screenshots); precipitation `1ufpMdZ8…` **200, 1999 B** (precipitation/complexation definitions + the "disable an equation" lesson); free `1H8TPVvs…` **200 but 3 bytes — empty**; acid/base `1Xc7jneT…` **401 — not publicly readable**. So one tool's instructions are unrecoverable without the user's Google account and one never had any.
→ **Closer:** `curl -sL "https://docs.google.com/document/d/1Xc7jneTG4IumAyiNCU7NByBu_8-x-RT50mgwmSvUPV0/export?format=txt"` while signed in (or have the user paste it); the other two are already at `/tmp/doc-1quyyL8y*.txt` and `/tmp/doc-1ufpMdZ8*.txt` — move them into `reference/`.

**6. `pk.png` holds the only textual pKa-scale taxonomy and nobody opened it.** Fetched: **200, 177 594 bytes**. The calcul-ph colour bands (`< −1.6`, `< 6.9`, `< 7.1`, `< 15.6`) are the machine-readable half; the French category labels ("acide très fort", "base très faible", …) exist *only* as pixels in this bitmap, which the site must redraw as an English SVG.
→ **Closer:** it is already at `/tmp/pk.png` — `cp /tmp/pk.png reference/` and Read it.

**7. No English name exists for any of the 190 species.** The sheet carries `ANameFR/BNameFR/ABNameFR` for **30 of 127 rows only**, and `update.js:46-62` discards them. A "searchable data-source tab" where `acetic acid` and `silver chloride` return nothing is not searchable — and `CH3CO2H`/`CH3COO-` already spell acetate two ways, so even formula search is split.
→ **Closer:** add `ANameEN/BNameEN/ABNameEN` columns to the sheet and pass them through `processData()` in `data/update.js`.

**8. A third of the table has no provenance at all.** All **39 precipitation rows** plus `HBr`/`HI` have empty `Source` *and* empty `temperature`; 11 more rows carry the literal string `unknown`; and **no ionic-strength column exists anywhere** — which matters more than temperature for a Ksp/β table. The data-source tab would render blanks for 41 of 127 rows.
→ **Closer:** fill `Source`/`temperature` and add `ionicStrength` in the sheet, then extend `processData()` to emit `{source, temperature, ionicStrength}`.

**9. The exercises tool has no pedagogic content to port.** rules/pedagogic-tools.md mandates 2–4 hints per exercise ordered vague→specific, a revealable solution, `[[term]]` glossary markers, a progress bar and a confirmation-protected reset. The legacy tool has **none** of these — it is a 20-item random drill with ±0.05 grading, no feedback, no hints, no solution, no persistence, and unanswered rows coloured identically to wrong ones. Not one hint has been drafted. Also undecided: grade against the simplified closed form (current, and the pedagogic point) or the exact solver, or show both.
→ **Closer:** author `site/src/data/exercises.ts` from `reference/extracted-exercices-ph.json` after picking the grading source.

---

## P2 — design decisions requiring a human

**10. No chart library was chosen by any report.** `react-plot@3.1.2` (zakodium-oss, peer `react >=18`) is in the clonall index and is the house answer, but nobody verified it does the four things these tools need: 20 series × 501 points; **log Y** (the legacy linear Y is a documented defect that hides trace species and forced the `-log10` hover table); filled rectangle annotations for the 21 indicator colour bands; x-crosshair tracking returning every series' interpolated y. Its exports are not in the clonall index, so this is unverified.
→ **Closer:** read `https://github.com/zakodium-oss/react-plot` for `Annotations.Rectangle` and the crosshair/tracking hook before writing a line of chart code.

**11. The deep-link payload is undefined for all six tools.** "Independently shareable via deep link" has no grammar: free/precipitation needs up to 190 selected species + per-species quantity + 9 sweep parameters + the disabled-equation set; titration needs analyte/titrant/concentration/volume/indicator; **pH exercises needs a PRNG seed** because the series is randomly generated — sharing is impossible without one (iupac already solves this with `ml-xsadd`). Nobody checked URL length.
→ **Closer:** write `site/src/utils/deepLink.ts` (encode/decode + round-trip test) before building any page.

**12. Pitfall P3 is a live blocker for the precipitation tool, not a footnote.** `checkSolid` tests `|Ksp − IAP| < solidTolerance` absolutely and linearly while Ksp spans 60 decades; the legacy precipitation view sets `solidTolerance: 1e-10`, **five orders tighter than the default**, so every large-Ksp hydroxide scenario drops points silently (`Ca++ 0.1 / OH- 0.1` returns `null` every time). Shipping this unchanged means the flagship replacement tool is wrong for hydroxide precipitation.
→ **Closer:** change `src/core/NewtonRaphton.js:262-272` to a relative test `Math.abs(1 - Ksp/solidKsp) < tol` and run `npm run test-only` — it is a numerics change to a published library, so it needs an explicit decision.

**13. The indicator dataset has no ingestion path and three unresolved rendering problems.** It is fetched from sheet `1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU` at page load; a static CSP'd site must vendor it. Unresolved: the first bromothymol-blue row is a degenerate `pH1 = pH2 = 0`; phenolphthalein and thymolphthalein use `white` (i.e. colourless) which is invisible on a white plot and undefined in dark mode; and `lime`/`fuchsia`/`violet` are CSS names needing hex. There is **no `update.js` for this sheet**, unlike the equilibrium DB.
→ **Closer:** `cp reference/indicators-raw.tsv` into the repo and write `data/update-indicators.js` mirroring `data/update.js`.

**14. `ColorBar.getColorScale` was never extracted, so the indicator visual cannot be reproduced.** Both the gradient bar in the indicator grid and the 100-band plot overlay come from the visualizer's internal `src/util/colorbar`. Its interpolation rule — linear in RGB or HSL? clamped or transparent outside the outermost stop? what is rendered *between* the two transitions of a polychromic indicator like thymol blue (1.2–2.8 and 8–9.6)? — determines exactly what the student sees, and no report has that source.
→ **Closer:** `find ~/git -path '*visualizer*/src/util/colorbar.js'` or fetch it from the lactame visualizer build.

**15. "Six tools" may be five.** The free and precipitation tools are the same UI; precipitation is the free tool with the sweep hard-coded to pH 0→14 / 501 points / `isFixed`, minus the normalized-equation columns and the parameter form. Whether they merge (one tool with a "simple/advanced" toggle) or stay separate changes the navigation, the deep-link grammar and the tutorial structure. Also unknown: whether any external page embeds the free tool via its `IframeBridge` contract (`{message:{eqType, localStorageId}}`) — replacing it would break those consumers silently.
→ **Closer:** a product decision from the user; for the iframe question, ask whether any course page embeds the free tool.

---

## P3 — concrete, smaller, still unresolved

**16. Six complexation rows are quantitatively wrong and two break charge balance.** `Mn(en)3++ / Fe(en)3++ / Co(en)3++ / Co(en)3+++ / Ni(en)3++ / Cu(en)2++` all declare `en: 1` while carrying cumulative β₃ (β₂) constants, so any ethylenediamine scenario a student builds is wrong by orders of magnitude; `Mn(OH)2` uses `Mn--` (should be `Mn++`) and `PbI2` uses `I--` (should be `I-`); `Cd(NH3)6++ 5.41 < Cd(NH3)4++ 7` and `AlF6--- 4.4 < AlF4- 8.3` are thermodynamically impossible; `HgBr4-- 4.48` is ~16 log units off literature and duplicates `PbI4-- 4.48`. Nobody decided: fix the sheet, hide the rows, or ship with a warning badge in the data-source tab.
→ **Closer:** fix the `B` cells in the sheet (`en` → `3 en`), then `npm run database`.

**17. `normalizeMF` is unverified at both ends.** The proposed regex maps `Cl-` → `Cl(-1)` and `Co(en)3++` → `Co(C2H8N2)3(+2)`; neither rendering was checked, and the choice between a local display helper and an upstream fix in `cheminfo/mass-tools/packages/mf-parser` (`getNumber` swallowing a trailing `-`) is open — we own that package.
→ **Closer:** `node -e "import('mf-parser').then(m=>console.log(m.parseToHtml('Cl(-1)'), m.parseToHtml('Co(C2H8N2)3(+2)')))"`.

**18. Performance is a measured non-issue — do not build a web worker.** Timed on repo HEAD, this machine: precipitation-equivalent sweep (Ag⁺ 0.01 / NH₃ 0.1, 501 points, `solidTolerance 1e-10`, `maxIterations 200`) **88 ms, errorCount 0**; acid/base H3PO4 201 points **13 ms**; titration CO3²⁻/HCl 501 points **45 ms**. Note this contradicts the precipitation report's "pH 13.0 fails → counter reads 1" — that came from the stale CDN 2.2.0 bundle, further evidence that all six live views run a 3-row-outdated database.

**19. The library exposes no single-point solve, and `getTitration` is more constrained than the reports imply.** calcul-ph fakes a single solve by calling `getTitration` with `titrationSolution: {type:'', volume:0}`, which does `helper.addSpecie('')` and `setTotal('', NaN)`. Verified at `src/helpers/Serie.js:26`: `titrVolStart` is hard-coded to `0`, so a burette pre-fill is impossible; and `resetSpecies()` + exactly two `addSpecie` calls means **one analyte and one titrant only** — no mixtures, no buffer, no added salt, unless the library changes. The site must call `helper.getEquilibrium().solveRobust()` directly for the pH calculator.

**20. P1 (volume) will silently corrupt the obvious next titration feature.** `atEquilibrium` is folded into β undivided (`Equilibrium.js:139,170`) while `cFixed` is divided by volume (`:200`), and `Serie.getTitration` sets `volume = totalVol` at every point. Harmless today only because no view pins a component during a titration — but "impose the pH while titrating" is a natural addition and would be wrong with no error. Decide whether to fix `_processModel` before designing the titration UI.