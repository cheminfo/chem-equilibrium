## Packages

| Package | Version | Org / repo | Notes |
|---|---|---|---|
| `react-mf` | **3.1.1** | zakodium-oss/react-mf | ESM only (`"type": "module"`, `exports: {".": "./lib/index.js"}`), ships `.d.ts`. Docs: https://react-mf.pages.dev/ |
| `mf-parser` | **3.9.2** (react-mf pins `^3.6.0`) | cheminfo/mass-tools → `packages/mf-parser` (local checkout at `/Users/lpatiny/git/cheminfo/mass-tools/packages/mf-parser`) | its only runtime dep |

## React 19 compatibility — fine

`peerDependencies: { react: ">=18", react-dom: ">=18" }`. Verified for real: installed `react@19.2.8` + `react-dom@19.2.8` + `react-mf@3.1.1`, no peer warnings, and `renderToStaticMarkup(<MF mf="..."/>)` produced correct markup for every case. (`@types/react@18` is only a devDependency of react-mf, so it does not leak.)

## Exported API — one component only

There is **no** `MFComponent`. The whole public surface is:

```ts
export interface MFProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  /** Molecular formula to display */
  mf: string;
}
export declare const MF: React.NamedExoticComponent<MFProps>;
```

`MF` is `memo`'d, memoizes parsing on `[mf]`, renders `<span {...otherProps}>`, so `className`, `style`, `title`, `onClick`, `data-*` all pass through. Confirmed: `<MF mf="SO4--" className="species" title="sulfate"/>` → `<span class="species" title="sulfate">SO<sub>4</sub></span>`.

**On an unparseable string it never throws** — the `try/catch` around `parse()` falls back to rendering the raw input text. So bad labels degrade silently rather than crashing; no error boundary needed, but also no signal that anything is wrong.

## Non-React helpers (usable in tests / Node)

All from `mf-parser`, no React involved:

- `parseToHtml(mf: string): string` — string → HTML string. The direct analogue of `<MF>`.
- `parse(mf, {expandGroups?, simplify?})` → token array (`Kind.ATOM`, `MULTIPLIER`, `CHARGE`, `MULTIPLIER_RANGE`, `ISOTOPE`, `SALT`, …). **Throws `MFError`** on invalid input, with a caret-pointer message.
- `toDisplay(tokens)` → `{kind, value}[]` using `Format.SUBSCRIPT | SUPERSCRIPT | SUPERIMPOSE | TEXT`; `toHtml(tokens)` → HTML string (note: `toHtml` takes **tokens**, not a string — passing a string silently returns `''`).
- `new MF(mf).getInfo()` → `{ mf, charge, mass, monoisotopicMass, atoms, ... }` — the best correctness oracle for tests.
- `isMF`, `ensureCase`, `subscript`/`superscript` char maps, `Format`, `Kind`, `Style`.

⚠️ **`isMF()` is not a safe validator** — it returned `true` for `'H2O)'` (which `parse` throws on) and `true` for `'CO3-2'` (which parses to something chemically wrong). Use `parse()` in a `try/catch` plus a charge check instead.

## Notation handling — the decisive finding

The number scanner (`getNumber` in `parse.js`) greedily consumes `-` as part of a number literal. This makes `+` and `-` **asymmetric**:

| Form | After a **letter** | After a **digit** |
|---|---|---|
| `+` / `++` | ✅ `H+` → +1 | ✅ `CO3++` → +2 |
| `-` / `--` | ✅ `OH-` → −1, `S--` → −2 | ❌ **charge silently dropped**, renders as neutral |
| `-N` | ✅ `Ca-2` | ❌ becomes a `multiplierRange`; `getInfo()` throws |
| `(±N)` | ✅ | ✅ **always correct** |

Measured examples:

```
CO3--   → tokens atom,atom,multiplier   → "CO₃"      charge 0   ← WRONG
HSO4-   → tokens atom,atom,atom,mult    → "HSO₄"     charge 0   ← WRONG
CO3-2   → multiplierRange{from:2,to:3}  → "CO₂₋₃"    getInfo THROWS
HSO4-1  → multiplierRange{from:1,to:4}  → "HSO₁₋₄"   getInfo THROWS
CO3^2-  → atom,atom,mult,text"^",mult   → "CO₃^₂"    mf "CO6"   ← WRONG (^ unsupported)
CO3(-2) → atom,atom,mult,charge         → superimposed ₃/⁻²   charge −2  ✅
```

- **`^` notation is not supported at all** — `^` becomes a text token and the following digit a *multiplier*, so `CO3^2-` computes as C O₆. Silently wrong; never use it.
- **Isotopes**: `[13C]H4` → `<sup>13</sup>CH<sub>4</sub>`, canonical `[13C]H4`. ✅
- **Parentheses**: fully supported; unbalanced throws `number of opening and closing parenthesis not equal`.
- **Superimpose**: when a charge follows a multiplier (e.g. `Ag(NH3)2+`, `Fe(H2O)6+3`), the charge and the count are stacked in an inline-flex `<span>` rather than plain `<sup>`/`<sub>`.
- **Hydrates**: `CuSO4.5H2O` is **silently wrong** — `.` is read as a decimal point, giving multiplier `4.5` → `H2CuO5.5S`. Use `CuSO4 . 5H2O` (spaces → `Kind.SALT`, renders `CuSO₄ • 5H₂O`) or `CuSO4(H2O)5`.

## The 12 labels you asked about

| Label | Renders as | Verdict |
|---|---|---|
| `CO3--` | CO₃ | ❌ charge lost |
| `H+` | H⁺ | ✅ |
| `OH-` | OH⁻¹ | ✅ |
| `Fe(H2O)6+3` | Fe(H₂O) with ⁺³/₆ stacked | ✅ charge +3 |
| `Fe(H2O)5OH+2` | Fe(H₂O)₅OH⁺² | ✅ charge +2 |
| `(C2H5)3NH+` | (C₂H₅)₃NH⁺ | ✅ |
| `Ag(S2O3)2-3` | Ag(S₂O₃)₂₋₃ | ❌ multiplierRange, `getInfo` throws |
| `Ag(NH3)2+` | Ag(NH₃) with ⁺/₂ stacked | ✅ |
| `CH3CO2H` | CH₃CO₂H | ✅ |
| `C6H5NH3+` | C₆H₅NH with ⁺/₃ stacked | ✅ |
| `HSO4-1` | HSO₁₋₄ | ❌ multiplierRange, `getInfo` throws |
| `CO3-2` | CO₂₋₃ | ❌ multiplierRange, `getInfo` throws |

## Audit of the actual chem-equilibrium database

I extracted all **190 unique species labels** from `/Users/lpatiny/git/cheminfo/chem-equilibrium/data/data.json` (`formed` + `components` keys) and ran every one. The DB uses the repeated-sign style (`---`), never the `-3` style — so there are **zero** `multiplierRange` cases, but the silent-charge-loss case is pervasive:

- **131 render correctly** (all cations work — `Fe+++`, `Al(H2O)6+++`, `Zn(NH3)4++`, plus anions whose `-` follows a letter: `Cl-`, `OH-`, `CN-`, `S--`, `HS-`, `SCN-`, `Br-`).
- **52 silently lose their charge** — every anion whose label ends in a digit before the sign: `CO3--`, `SO4--`, `HCO3-`, `H2PO4-`, `HPO4--`, `PO4---`, `NO3-`, `NO2-`, `ClO4-`, `CrO4--`, `S2O3--`, `C2O4--`, `Fe(CN)6---`, `Fe(CN)6----`, `Ag(S2O3)2---`, `Co(C2O4)3----`, `Zn(OH)4--`, `Cu(OH)4--`, `AgCl2-`, `HgI4--`, …
- **7 throw** (`found a lowercase not following an uppercase`) and fall back to raw text: the ethylenediamine complexes `Co(en)3++`, `Co(en)3+++`, `Cu(en)2++`, `Fe(en)3++`, `Mn(en)3++`, `Ni(en)3++`, and the bare ligand `en`.

That is **59/190 (31%) rendering wrong**, and 52 of them wrong *silently and invisibly* — the user just sees a neutral formula.

## Fix: normalize before rendering

Rewriting the trailing charge into the parenthesised form fixes **189/190** (only the bare ligand name `en` remains, which is a name rather than a formula):

```ts
/** Rewrite a trailing charge into the unambiguous form mf-parser always parses correctly. */
export function normalizeMF(label: string): string {
  return label
    .replace(/\(en\)/g, '(C2H8N2)')            // ethylenediamine ligand
    .replace(/(\++|-+)$/, (m) => `(${m[0]}${m.length})`)
    .replace(/([+-])(\d+)$/, (_, sign, n) => `(${sign}${n})`);
}
// CO3--        -> CO3(-2)
// PO4---       -> PO4(-3)
// Ag(S2O3)2--- -> Ag(S2O3)2(-3)
// Fe(CN)6----  -> Fe(CN)6(-4)
// Co(en)3++    -> Co(C2H8N2)3(+2)
```

Note `normalizeMF` is display-only — keep the original string as the species key. Since we own `cheminfo/mass-tools`, the better long-term fix is upstream in `packages/mf-parser`: stop `getNumber` from swallowing a trailing `-` run that is not followed by a digit, so `CO3--` yields a `CHARGE` token. Worth an issue either way.

## Rendering a list of species

```tsx
import { MF } from 'react-mf';

interface SpeciesListProps {
  species: string[];
}

export function SpeciesList({ species }: SpeciesListProps) {
  return (
    <ul>
      {species.map((label) => (
        <li key={label}>
          <MF mf={normalizeMF(label)} title={label} />
        </li>
      ))}
    </ul>
  );
}
```

Because charges render via an inline-flex `SUPERIMPOSE` span, give the container `line-height: 1.6` or more, otherwise stacked charges collide with adjacent rows.

For unit tests, assert on `mf-parser` directly rather than rendering — `expect(new MF(normalizeMF('CO3--')).getInfo().charge).toBe(-2)` — no jsdom needed.