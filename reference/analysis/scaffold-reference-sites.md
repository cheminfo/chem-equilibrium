# Reference study: `regexp.cheminfo.org` and `iupac.cheminfo.org`

Paths: `/Users/lpatiny/git/cheminfo/regexp.cheminfo.org`, `/Users/lpatiny/git/cheminfo/iupac.cheminfo.org`

**Provenance (git):** regexp was created first — `649a80f feat: initialize regexp.cheminfo.org` at `2026-05-22 08:43:43`, HEAD `e7dd40a` at `11:22:16`. iupac was cloned from it later the same day — `103e7e4 feat: initial commit` at `2026-05-22 13:47:23`, HEAD `7dc13d8` at `14:25:36` (iupac has uncommitted work in the tree: `src/pages/StructureToName.tsx`, `src/iupac/parseName.ts`, `features.ts`, `hints.ts` tests).

Consequence: **iupac's initial commit copied regexp's config files as they stood *after* regexp's `3662942 test: add Playwright e2e suite and unit-test plumbing`**, so the two config sets are byte-identical except for iupac's generated-file/scripts carve-outs. Verified with a file-by-file diff:

```
SAME: vite.config.ts .prettierrc.json .npmrc .gitignore .dockerignore Dockerfile
      .env.example playwright.config.ts  and all four .github/workflows/*.yml
DIFF: vitest.config.ts   → iupac adds  exclude: ['src/data/molecules.generated.ts']
DIFF: tsconfig.json      → iupac uses  "types": ["node"]  and  include +"scripts"
DIFF: eslint.config.js   → iupac adds  'scripts', 'src/data/molecules.generated.ts' to globalIgnores
DIFF: .prettierignore    → iupac adds  src/data/molecules.generated.ts
```

**Which is more current:** iupac for `package.json`/`tsconfig`/ignore lists (later timestamps, superset content); regexp for everything else — it has the richer `src/styles/global.css`, four e2e specs vs two, a `CHANGELOG.md` (release-please ran; iupac has none), a `public/` folder, and an `About` page with the EPFL credit. **Neither is fully aligned with current standards** (section 6).

---

## 1. Config files a new sibling (`equilibrium.cheminfo.org`) should copy

Below, "COPY AS-IS" = identical in both repos and correct. "COPY WITH FIX" = must be modernised before use (details in §6).

### `package.json` — COPY WITH FIX

regexp (verbatim):

```json
{
  "name": "regexp-cheminfo-org",
  "version": "1.0.0",
  "description": "Interactive pedagogic tool to learn regular expressions with live testing and exercises.",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "vite build",
    "check-types": "tsc --noEmit",
    "dev": "vite",
    "eslint": "eslint src",
    "eslint-fix": "eslint src --fix",
    "preview": "vite preview",
    "prettier": "prettier --check src",
    "prettier-write": "prettier --write src",
    "test": "npm run test-only && npm run check-types && npm run eslint && npm run prettier",
    "test-e2e": "playwright test",
    "test-e2e-ui": "playwright test --ui",
    "test-only": "vitest run --coverage"
  },
  "dependencies": {
    "@blueprintjs/core": "^6.15.0",
    "@blueprintjs/icons": "^6.10.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "regexper": "^1.0.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "@types/react": "^18.3.28",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^6.0.2",
    "@vitest/coverage-v8": "^4.1.7",
    "@zakodium/tsconfig": "^1.0.5",
    "eslint": "^9.39.4",
    "eslint-config-cheminfo-react": "^20.0.1",
    "eslint-config-cheminfo-typescript": "^22.0.0",
    "prettier": "^3.8.3",
    "typescript": "^6.0.3",
    "vite": "^8.0.14",
    "vitest": "^4.1.7"
  }
}
```

iupac differs only in name/description, `"build": "npm run build-exercises && vite build"` + `"build-exercises": "node scripts/buildExercises.ts"`, and these extra deps: `ml-xsadd ^3.0.1`, `openchemlib ^9.22.1`, `react-mf ^3.1.1`, `react-ocl ^8.7.1`, `"iupac-names": "file:../structure-to-name/packages/iupac-names"` (a **local `file:` path dep — never copy this**, it is unbuildable in Docker and non-reproducible), plus `@types/node ^22.19.19`.

Fixes for the new site: `eslint .` / `prettier --check .` (not `src`), React `^19.2.5` + `@types/react ^19.2.14` / `@types/react-dom ^19.2.3`, `eslint-config-zakodium ^20.0.0` replacing the two cheminfo configs, `"version": "0.0.0"`, add `@preact/signals-react ^3.3.1` if you follow rules/react.md state management. Keep `eslint: "^9"` and `typescript: "^6"`. Note the extra `test-e2e` / `test-e2e-ui` scripts — keep them, they are alphabetically correct.

### `vite.config.ts` — COPY AS-IS (identical in both)

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
```

### `vitest.config.ts` — COPY AS-IS (regexp version)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
```

The explicit `include` is **load-bearing**: vitest's default glob `**/*.{test,spec}.*` would otherwise pick up the Playwright specs in `e2e/`. The coverage glob `['src/**/*.ts', 'src/**/*.tsx']` is equivalent to the standard `src/**/*.{ts,tsx}` — this is *not* a deviation, `.tsx` is covered. iupac adds `exclude: ['src/data/molecules.generated.ts']`; copy that pattern if the new site generates a data file. If equilibrium loads openchemlib or another heavy compute dep in tests, consider `provider: 'istanbul'` per rules/testing.md.

### `tsconfig.json` — COPY WITH FIX

regexp:

```json
{
  "extends": "@zakodium/tsconfig",
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "outDir": "dist",
    "jsx": "react-jsx",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": []
  },
  "include": ["src", "vite*.ts", "vitest*.ts"]
}
```

iupac: `"types": ["node"]` and `"include": ["src", "scripts", "vite*.ts", "vitest*.ts"]` (it has a Node build script).

Both are **outdated**. rules/typescript.md § Frontend tsconfig requires the `/jsx` entry point:

```json
{
  "extends": "@zakodium/tsconfig/jsx",
  "compilerOptions": {
    "noEmit": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src", "vite*.ts"]
}
```

Keep `"vitest*.ts"` in `include` (both repos have it and it is genuinely needed — the template's `vite*.ts` glob does not match `vitest.config.ts`… actually it does, `vite*` prefixes `vitest`; the extra entry is harmless).

### `eslint.config.js` — COPY WITH FIX

regexp:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import cheminfoReact from 'eslint-config-cheminfo-react';
import cheminfoTs from 'eslint-config-cheminfo-typescript';

export default defineConfig(
  globalIgnores([
    'coverage',
    'dist',
    'e2e',
    'playwright.config.ts',
    'playwright-report',
    'test-results',
  ]),
  ...cheminfoTs,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: cheminfoReact,
  },
);
```

iupac inserts `'scripts',` and `'src/data/molecules.generated.ts',` into the ignore array (alphabetical, between `playwright-report` and `test-results`).

Correct form for an **app** (rules/tooling.md § ESLint config packages — zakodium family, not cheminfo):

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores([
    'coverage',
    'dist',
    'e2e',
    'playwright.config.ts',
    'playwright-report',
    'test-results',
  ]),
  ts,
  unicorn,
  react,
);
```

Keep the **broadened `globalIgnores`** (`e2e`, `playwright.config.ts`, `playwright-report`, `test-results`) — that is a deliberate local superset over the template's `['coverage', 'dist']` and rules/tooling.md forbids narrowing it. It is also what makes `eslint .` (whole repo) viable.

### `.prettierrc.json` — COPY AS-IS (identical, matches standard exactly)

```json
{
  "arrowParens": "always",
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### `.prettierignore` — COPY AS-IS (regexp)

```
CHANGELOG.md
coverage
dist
node_modules
package-lock.json
playwright-report
test-results
```

iupac adds `src/data/molecules.generated.ts` after `package-lock.json`. Again a deliberate superset over the template's four lines — keep it.

### `.npmrc` — COPY AS-IS

```
ignore-scripts=true
```

### `.gitignore` — COPY WITH FIX

Both:

```
node_modules
dist
coverage
playwright-report
test-results
.env
compose.yaml
.DS_Store
.claude
*.log
```

**Remove the `compose.yaml` line** — under the current standard `compose.yaml` is committed (§5). Everything else is right (`.claude` and `coverage` present per rules/git.md).

### `.dockerignore` — COPY WITH FIX

Both:

```
node_modules
dist
coverage
playwright-report
test-results
e2e
.git
.github
.claude
.env
compose.yaml
compose.example.*.yaml
*.log
.DS_Store
```

Replace the last two compose lines with a single `compose*.yaml`.

### `Dockerfile` — COPY WITH FIX (identical in both)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2-alpine
COPY --from=builder /app/dist /public
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=/public/index.html
ENV SERVER_PORT=80
EXPOSE 80
```

Only fix: `FROM node:24-alpine` (rules/docker.md § Node.js base image — current LTS major). Everything else (multi-stage, `npm ci`, static-web-server, `SERVER_FALLBACK_PAGE` for SPA hash/deep-link fallback, port 80) matches the standard verbatim.

### `.env.example` — COPY WITH FIX (identical in both)

```sh
# Port published on the host (container always serves on 80)
PORT=8080
# Cloudflare Tunnel token (cloudflared deployment only)
# TUNNEL_TOKEN=
```

Missing the mandatory `COMPOSE_FILE` picker block; prepend:

```sh
# Deployment mode: uncomment exactly ONE line to choose how the service is
# exposed. With none uncommented, docker compose uses compose.yaml by default.
# COMPOSE_FILE=compose.yaml             # port-published (publishes PORT on the host)
# COMPOSE_FILE=compose.traefik.yaml     # behind a Traefik reverse proxy
# COMPOSE_FILE=compose.cloudflared.yaml # behind a Cloudflare Tunnel (no published port)
```

### `playwright.config.ts` — COPY AS-IS (identical in both)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
```

### `index.html` — COPY AS-IS (structure)

regexp:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RegExp Playground — cheminfo</title>
    <meta
      name="description"
      content="Interactive pedagogic tool to learn regular expressions with live testing and exercises."
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

iupac is identical with its own title/description. **Warning:** iupac links `/favicon.svg` but has **no `public/` directory at all** (`git ls-files | grep public` → nothing) — a live 404. regexp ships `public/favicon.svg` (an inline-text SVG, dark-blue rounded square with yellow `.*`) and `public/epfl-logo.svg`. The new site must ship both.

### `src/main.tsx` — COPY AS-IS (iupac version; regexp adds a regexper-specific polyfill import)

```tsx
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import './styles/global.css';

import { FocusStyleManager } from '@blueprintjs/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

FocusStyleManager.onlyShowFocusOnTabs();

const container = document.querySelector('#root');
if (!container) {
  throw new Error('Root container #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Note `document.querySelector('#root')` (not `getElementById`) and the explicit throw — both repos identical. `FocusStyleManager.onlyShowFocusOnTabs()` is the BlueprintJS focus workaround, paired with the CSS reset in `global.css` (§3).

### `LICENSE` — identical MIT in both (`diff` returns nothing). Copy.

---

## 2. Routing: hash router, tabs, deep links, localStorage

There is **no router library**. The whole thing is ~40 lines split between `src/utils/router.ts` and `App.tsx`.

### The parser — `src/utils/router.ts` (identical in both repos)

```ts
/**
 * Split a hash-route into segments. `'#/exercises/foo'` → `['exercises', 'foo']`.
 * Empty hash → `['']`.
 * @param hash - The hash string, including the leading `#`.
 * @returns The slash-separated segments.
 */
export function parseHashPath(hash: string): string[] {
  return hash.replace(/^#\/?/, '').split('/');
}
```

iupac adds a query-string reader on the *full URL* (the `?series=` teacher-share token lives before the hash):

```ts
export function readSeriesParam(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('series');
  } catch {
    return null;
  }
}
```

### Top-level tab routing — `App.tsx`

```ts
type Route = 'tutorial' | 'playground' | 'exercises' | 'cheatsheet' | 'glossary' | 'about';

const ROUTES: Array<{ id: Route; label: string }> = [
  { id: 'tutorial', label: 'Tutorial' },
  { id: 'playground', label: 'Playground' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'cheatsheet', label: 'Cheatsheet' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'about', label: 'About' },
];

const VALID_ROUTES = new Set<string>(ROUTES.map((r) => r.id));

function parseHash(hash: string): Route {
  const [first] = parseHashPath(hash);
  if (first && VALID_ROUTES.has(first)) {
    return first as Route;
  }
  return 'tutorial';         // unknown hash → silent fallback to first tab
}
```

Read on mount, sync on `hashchange`, write on tab click:

```ts
const [route, setRoute] = useState<Route>(() => parseHash(globalThis.location.hash));

useEffect(() => {
  function onHashChange() {
    setRoute(parseHash(globalThis.location.hash));
  }
  globalThis.addEventListener('hashchange', onHashChange);
  return () => {
    globalThis.removeEventListener('hashchange', onHashChange);
  };
}, []);

const handleTabChange = useCallback((tabId: string) => {
  let target = `#/${tabId}`;
  if (tabId === 'exercises') {
    const lastExercise = readLastExerciseId();
    if (lastExercise) {
      target = `#/exercises/${encodeURIComponent(lastExercise)}`;
    }
  }
  globalThis.history.pushState(null, '', target);
  setRoute(tabId as Route);
}, []);
```

Key details:

- `globalThis`, never `window`, for `location` / `history` / `addEventListener`.
- **`history.pushState`, not `location.hash = …`** — so the tab click does *not* fire `hashchange` (state is set synchronously in the same callback); back/forward *do* fire it and re-derive the route. The e2e suite asserts exactly this (`page.goBack()` → tab `aria-selected`).
- The **exercises tab is special**: clicking it rewrites the target to the deep link `#/exercises/<lastId>` read from localStorage, so returning to the tab restores the student's place *in the URL*, not only in state.
- Rendering is a plain `{route === 'x' && <X />}` chain; there is no route table → component map.

### Sub-route `#/exercises/<id>`

Parsed in `src/utils/exerciseState.ts` (validated against the catalogue, so a stale/bogus id is rejected):

```ts
export function readExerciseIdFromHash(hash: string): string | null {
  const segments = parseHashPath(hash);
  if (segments[0] !== 'exercises') return null;
  const id = segments[1];
  if (!id) return null;
  const decoded = decodeURIComponent(id);
  return EXERCISES.some((ex) => ex.id === decoded) ? decoded : null;   // iupac: findExercise(decoded)
}
```

Resolution order for the active exercise, regexp `pages/Exercises.tsx`:

```ts
const [activeId, setActiveIdState] = useState<string>(() => {
  const id =
    readExerciseIdFromHash(globalThis.location.hash) ??
    readLastExerciseId() ??
    FIRST_EXERCISE?.id ??
    '';
  if (id) writeLastExerciseId(id);
  return id;
});
```

**iupac's version is strictly better and is the one to copy** — it (a) validates the candidate id against the *currently active* subset, (b) listens for `hashchange` inside the page, and (c) **pushes the hash when the student picks an exercise from the menu**, which regexp does not do:

```ts
useEffect(() => {
  function onHashChange() {
    const fromHash = readExerciseIdFromHash(globalThis.location.hash);
    if (fromHash && activeExercises.some((entry) => entry.id === fromHash)) {
      setActiveIdState(fromHash);
      writeLastExerciseId(fromHash);
    }
  }
  globalThis.addEventListener('hashchange', onHashChange);
  return () => { globalThis.removeEventListener('hashchange', onHashChange); };
}, [activeExercises]);

const selectExercise = useCallback((id: string) => {
  setActiveIdState(id);
  writeLastExerciseId(id);
  globalThis.history.pushState(null, '', `#/exercises/${encodeURIComponent(id)}`);
}, []);
```

regexp's gap is documented in its own e2e test comment: *"The in-page 'select another exercise' buttons do NOT push a new hash (only switching the top-level Tab does)"*.

### localStorage layer — `src/utils/storage.ts` (identical logic, different key prefix)

```ts
export const STORAGE_KEYS = {
  exerciseStates: 'regexp-cheminfo:exercise-state:v1',
  lastExercise: 'regexp-cheminfo:active-exercise:v1',
} as const;
```

iupac adds `playgroundState: 'iupac-cheminfo:playground:v1'` and `seriesAssignments: 'iupac-cheminfo:series-assignments:v1'`. Convention: `<site>-cheminfo:<concern>:v1` — namespaced, **versioned**.

Four quota-safe, never-throwing helpers — `readJson` / `writeJson` / `readString` / `writeString`, each guarded by `if (typeof window === 'undefined') return …` plus `try/catch` with a silent fallback:

```ts
export function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort: ignore quota and serialisation errors.
  }
}
```

Per-exercise state map (`src/utils/exerciseState.ts`) with **soft migration on read** — this is the pattern from rules/pedagogic-tools.md, implemented literally:

```ts
export type StateMap = Record<string, ExerciseState>;

export function defaultState(): ExerciseState {
  return { pattern: '', flags: '', replacement: '', status: 'idle',
           hintsRevealed: 0, showSolution: false, showDiagram: false };
}

export function loadState(): StateMap {
  const parsed = readJson(STORAGE_KEYS.exerciseStates) as Record<string, Partial<ExerciseState>> | null;
  if (!parsed || typeof parsed !== 'object') return {};
  const migrated: StateMap = {};
  for (const [id, value] of Object.entries(parsed)) {
    migrated[id] = { ...defaultState(), ...value };   // new fields land as defaults
  }
  return migrated;
}
```

Whole-map persistence is one effect in the page: `useEffect(() => { saveState(statesByExercise); }, [statesByExercise]);` — one localStorage key for all exercises, never one key per exercise.

Auto-solve on live validation, with the only sanctioned eslint-disable in the codebase:

```ts
useEffect(() => {
  if (validation.passed && state.status !== 'solved') {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: auto-mark as solved when the student types a valid answer, so the menu badge updates without requiring a "Check" click.
    updateState({ status: 'solved' });
  }
}, [validation.passed, state.status, updateState]);
```

---

## 3. BlueprintJS usage patterns

**Version: BlueprintJS 6** (`@blueprintjs/core ^6.15.0`, `@blueprintjs/icons ^6.10.0`; installed 6.15.0 in both). All CSS hooks are `bp6-*`.

### Tabs

```tsx
<div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
  <Tabs id="main-tabs" selectedTabId={route} onChange={handleTabChange}>
    {ROUTES.map((r) => (
      <Tab key={r.id} id={r.id} title={r.label} />
    ))}
  </Tabs>
</div>
```

Controlled (`selectedTabId` + `onChange`), no `panel` prop — panels are rendered manually below the tab strip so the hash router owns the switch. The whole header + tab strip carries `className="no-print"`.

### Cards / headings

`<Card elevation={1}>` everywhere, stacked inside `<div className="section-stack">` (flex column, `gap: 16px`). Headings are `H4` / `H5` with `style={{ margin: 0 }}` or `marginTop: 8` inline. Two-column layouts use `<div className="split">` (CSS grid `1fr 1fr`, collapsing at 980px).

### Callouts — one intent per pedagogic state

| Purpose | Callout |
|---|---|
| Tutorial step explanation | `<Callout intent="primary" icon="info-sign" title={step.title}>` |
| Solved | `<Callout intent="success" icon="confirm" title="Brilliant! Exercise solved.">` |
| Attempted but failing | `<Callout intent="danger" icon="cross" title="Not quite yet">` |
| Hints | `<Callout intent="primary" icon="lightbulb" title="Hints">` with an `<ol>` |
| Revealed solution | `<Callout intent="warning" icon="key" title="Sample solution">` with `<Code>` |

### Tags — level / kind / status / hint-count

```tsx
<Tag minimal intent={LEVEL_INTENT[exercise.level]}>{exercise.level}</Tag>
{exercise.kind === 'replace' && <Tag minimal intent="primary">replace</Tag>}
{isSolved && <Tag minimal intent="success" icon="tick">solved</Tag>}
{hintsRevealed > 0 && (
  <Tag minimal intent="warning" icon="lightbulb"
       title={isSolved ? `Solved with ${hintsRevealed} hint…` : `${hintsRevealed} hint… revealed`}>
    {hintsRevealed} hint{hintsRevealed > 1 ? 's' : ''}
  </Tag>
)}
```

Intent mapping is centralised in `src/utils/exerciseDisplay.ts` and shared by menu + active card:

```ts
export const LEVEL_INTENT: Record<ExerciseLevel, Intent> = {
  beginner: 'success', intermediate: 'warning', advanced: 'danger',
};

export const STATUS_DISPLAY: Record<ExerciseStatus, StatusDisplay> = {
  solved:    { icon: 'tick-circle',  intent: 'success', className: 'is-solved' },
  attempted: { icon: 'warning-sign', intent: 'warning', className: 'is-attempted' },
  idle:      { icon: 'circle',       intent: 'none',    className: '' },
};
```

### Buttons

`variant={isActive ? 'solid' : 'outlined'}` + `active={isActive}` for the exercise menu; `size="small"` for tutorial step numbers and flag toggles; `<ButtonGroup>` for the five-button exercise action row (`Check my regex` / `Reveal hint (n/total)` / `Show|Hide diagram` / `Reveal|Hide solution` / `Reset`) and the tutorial Previous/Next pair (`icon="arrow-left"` / `endIcon="arrow-right" intent="primary"`). Text goes through the `text=` prop, not children. `<AnchorButton href target="_blank" rel="noreferrer">` for external links.

### Tooltips — two distinct kinds

**(a) Glossary tooltip** — default Blueprint styling, `popoverClassName="glossary-popover"`. The `[[term]]` renderer:

```tsx
const TERM_MARKER = /\[\[(?<term>[^\]]+)\]\]/g;

export function GlossaryDescription({ description }: GlossaryDescriptionProps) {
  const parts = description.split(TERM_MARKER);
  return (
    <>
      {parts.map((part, idx) => {
        const key = `${idx}:${part}`;
        if (idx % 2 === 0) return <Fragment key={key}>{part}</Fragment>;
        const entry = GLOSSARY[part.toLowerCase()];
        if (!entry) return <Fragment key={key}>{part}</Fragment>;   // forgiving fallback
        return (
          <Tooltip key={key} content={<GlossaryEntryTooltip entry={entry} />}
                   popoverClassName="glossary-popover">
            <span className="glossary-term">{part}</span>
          </Tooltip>
        );
      })}
    </>
  );
}
```

Splitting on a regex **with a capture group** is what interleaves text (even indices) and terms (odd indices). Unknown terms render as bare text — never `[[brackets]]`.

**(b) Syntax tooltip** — the shared dark rich tooltip, used in three places (cheatsheet rows, flag toggle buttons, help icons):

```tsx
<Tooltip
  content={<SyntaxTooltip content={{ syntax, name, tag, summary, detail, example }} />}
  placement="right"        // "bottom" on the flag toggles
  hoverOpenDelay={150}
  popoverClassName="syntax-tooltip-popover"
>
```

`SyntaxTooltipContent` is `{ syntax, name, tag?, summary, detail, example: { pattern, input, note } }` — exactly the shape in rules/pedagogic-tools.md §4. Rows without `detail + example + name` fall back to plain `<td>` cells (`const hasRichTooltip = Boolean(item.detail && item.example && item.name)`).

### Focus reset

Two halves, both required:

1. `FocusStyleManager.onlyShowFocusOnTabs();` in `main.tsx`, before `createRoot`.
2. In `global.css`:

```css
*:focus,
*:focus-visible {
  outline: none !important;
}
```

### Dark / light handling

**There is none.** Both sites are hard light-mode: `html, body, #root { background: white }`, no `bp6-dark` class, no `prefers-color-scheme` media query, hard-coded Blueprint greys (`#5c7080` muted, `#182026` text, `#0e5a91` accent blue, `#d3d8de`/`#e1e8ed` borders, `#f5f8fa` panel fill). The only "dark" surfaces are the two tooltip popovers, styled manually to `#1f2937` / `#f3f4f6`.

### `global.css` conventions

Ordering in the file: `:root` custom properties → box-sizing reset → focus reset → `html, body, #root` → Blueprint overrides → utility classes → component classes → one `@media print` block at the very end.

```css
:root {
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  --match-bg: #fde68a;        /* regexp only */
  --match-active: #f59e0b;    /* regexp only */
}
```

Named conventions worth carrying over verbatim:

- `.app-shell` — the outer wrapper (also given inline `maxWidth: 1400, margin: '0 auto', padding: 16`).
- `.section-stack` — `display:flex; flex-direction:column; gap:16px`. The universal vertical stack.
- `.split` — `grid-template-columns: minmax(0,1fr) minmax(0,1fr)`, collapses to `1fr` under 980px.
- `.exercise-list` — `grid-template-columns: 340px minmax(0,1fr)`, collapses under 980px.
- `.exercise-menu` — `max-height: 70vh; overflow: auto`, with `.bp6-button { justify-content: flex-start !important; text-align: left !important; }` and status tints `.is-solved` (`#e8f7ee` / `#62b97f`) and `.is-attempted` (`#fff7e6` / `#e0a700`).
- `.muted` — `color: #5c7080`, applied to `<p>` lead paragraphs and secondary `H4`s.
- `.no-print` — hides chrome; the print block also flattens `.reference-grid` to `column-count: 2`, strips Card shadows, forces `.app-shell` padding to 0, and sets `@page { size: A4; margin: 12mm }`.
- `.logo` — the yellow chip in the `<h1>` (`background:#fde047; color:#0e5a91; border-radius:6px; font-family:var(--font-mono)`).
- `.header-link` / `.header-link--icon-only` — the right-hand header link row (spec link, GitHub, Feedback).
- `.tutorial-level` / `.tutorial-level-label` / `.tutorial-level-buttons` — the three color-coded step strips.
- Blueprint override needed in both: `.bp6-tab-panel[role='tabpanel'] { overflow: visible; }` (otherwise tooltips clip).
- regexp-only, `regexper`-specific: `.bp6-icon > svg { background-color: transparent; }` with a comment explaining the leaked global `svg { background-color:#fff }`. **Do not copy** unless the new site pulls in a library with the same defect.

Inputs always carry `spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off"` plus an `aria-label` (see `RegexInput.tsx`), and set `intent={error ? 'danger' : 'none'}` for live compile errors, with the error text rendered *below* the bar (`.regex-error`), never in a toast.

---

## 4. Component / data split and content typing

Layout (regexp — the canonical one; the ratio "few components, many data files" is deliberate, per rules/pedagogic-tools.md §11):

```
src/
  App.tsx                  hash router + tab strip + header (163 lines)
  main.tsx                 CSS imports, FocusStyleManager, createRoot
  types.ts                 every shared domain type, JSDoc'd (117 lines)
  vite-env.d.ts
  regexperPolyfill.ts      site-specific
  styles/global.css
  data/                    PEDAGOGIC CONTENT — plain typed arrays/records
    tutorial.ts            TutorialStep[], TUTORIAL_LEVELS, TRY_IT_HELP
    exercises.ts           EXERCISES: Exercise[]
    glossary.ts            GLOSSARY: Record<string, GlossaryEntry>
    reference.ts           REFERENCE_SECTIONS: ReferenceSection[]
    flags.ts               FLAGS: FlagDescriptor[]
  components/              14 thin presenters
    GlossaryTooltip.tsx GlossaryExamples.tsx SyntaxTooltip.tsx
    ExerciseMenu.tsx ActiveExerciseCard.tsx TestCaseRow.tsx
    RegexInput.tsx ReplacementInput.tsx RegexDiagram.tsx
    HighlightedText.tsx MatchDetails.tsx VisibleText.tsx
    ReferencePanel.tsx PrintButton.tsx
  pages/                   one file per tab
    Tutorial.tsx Playground.tsx Exercises.tsx Cheatsheet.tsx Glossary.tsx About.tsx
  regex/                   DOMAIN LOGIC, importable and unit-tested
    compile.ts validate.ts
    __tests__/compile.test.ts __tests__/validate.test.ts
  utils/
    router.ts storage.ts exerciseState.ts exerciseDisplay.ts testCase.ts
```

iupac is the same skeleton with `src/iupac/` as the domain folder (`exercises.ts hints.ts structure.ts validate.ts features.ts series.ts normalize.ts nameToStructure.ts parseName.ts` + 8 test files in `__tests__/`), and it adds a **build-time data generation** step: `scripts/exercises.tsv` → `node scripts/buildExercises.ts` → `src/data/molecules.generated.ts` (wired as `"build": "npm run build-exercises && vite build"`, ignored by eslint/prettier/coverage). That script computes OCL `idCode` and molecular formula at build time so runtime validation never depends on SMILES round-tripping.

Note this deviates from rules/react.md § Frontend structure ("organize by page, not component type") — both sites use a flat `components/` + `pages/` split. It is consistent between the two and works at this size, but it is a knowing deviation.

### Content typing

Everything is a **plain exported const with a JSDoc'd interface**, no runtime schema, no JSON files. Optional fields always carry `@default` per rules/documentation.md.

`TutorialStep` (regexp, defined in `data/tutorial.ts` next to its data — iupac puts it in `types.ts` instead):

```ts
export interface TutorialStep {
  title: string;
  description: string;      // may contain [[term]] markers
  pattern: string;
  flags: string;
  text: string;
  /** Pedagogic level used to group and color-code the step buttons. */
  level: ExerciseLevel;
  /**
   * Replacement string. When set, the step is a search-and-replace example.
   * @default undefined
   */
  replacement?: string;
}

export interface TutorialLevelMeta {
  level: ExerciseLevel;
  label: string;
  /** Light background color applied to the group container. */
  background: string;
  /** Slightly darker color used for the currently selected step. */
  activeBackground: string;
}

export const TUTORIAL_LEVELS: TutorialLevelMeta[] = [
  { level: 'beginner',     label: 'Basics',            background: '#d1fae5', activeBackground: '#6ee7b7' },
  { level: 'intermediate', label: 'Search & replace',  background: '#fef3c7', activeBackground: '#fcd34d' },
  { level: 'advanced',     label: 'Advanced features', background: '#fce7f3', activeBackground: '#f9a8d4' },
];
```

Content authored with `String.raw` wherever backslashes appear, exactly as the rule prescribes:

```ts
description: String.raw`Characters like . * + ? ( ) [ ] { } have a special meaning. [[Escape]] them with \ to match them literally — for example \. matches a dot.`,
pattern: String.raw`\.`,
```

`Exercise` is a **discriminated union on `kind`** with a shared base (`src/types.ts`):

```ts
interface BaseExercise {
  id: string;
  title: string;
  level: ExerciseLevel;
  description: string;
  hints: string[];
  /** Sample pattern shown only when the student reveals the solution. */
  solution: string;
  /**
   * Flags paired with `solution` … Not enforced by the validator — flag needs
   * must emerge naturally from the test cases.
   * @default []
   */
  solutionFlags?: FlagKey[];
}
export interface MatchExercise   extends BaseExercise { kind: 'match';   testCases: MatchTestCase[] }
export interface ReplaceExercise extends BaseExercise { kind: 'replace'; testCases: ReplaceTestCase[]; solutionReplacement: string }
export type Exercise = MatchExercise | ReplaceExercise;
```

with test cases that pin exact expected substrings and mix positive/negative:

```ts
export interface MatchTestCase {
  text: string;
  shouldMatch: boolean;
  /** … the candidate regex must find this exact substring … @default undefined */
  expected?: string;
  /** … pins the value of `match[i + 1]` … @default undefined */
  expectedGroups?: Array<string | undefined>;
}
```

`GlossaryEntry` — keyed lowercase, three-part body:

```ts
export interface GlossaryExample {
  pattern: string;
  /** … Omit when the example is about syntax only … @default undefined */
  text?: string;
  /** @default undefined */
  note?: string;
}
export interface GlossaryEntry { title: string; summary: string; examples: GlossaryExample[] }

/**
 * Keyed by the literal term used inside `[[...]]` markers in step descriptions.
 * Keys are lowercase; lookups should also lowercase the marker text.
 */
export const GLOSSARY: Record<string, GlossaryEntry> = { … };
```

`ReferenceItem` / `ReferenceSection` for the cheatsheet, and `FlagDescriptor` for the option toggles — both carrying the `SyntaxTooltipExample` payload so cheatsheet and toggles render through the same component.

iupac shows the alternative content model: exercises are **derived**, not authored — `buildExerciseCatalogue()` emits two exercises per molecule (`nts:<id>` / `stn:<id>` composite ids via `exerciseId(moleculeId, kind)`), with an `EXERCISES_BY_ID` `Map` for O(1) `findExercise(id)`.

---

## 5. Docker / static-web-server deployment and GitHub workflows

### Runtime shape

Multi-stage build → `joseluisq/static-web-server:2-alpine` serving `/public` on port 80 with `SERVER_FALLBACK_PAGE` for SPA deep links. Container port is always 80; the host port is compose-side only (`${PORT:-8080}:80`). No volumes, no backend. This part is fully current and matches the `create-frontend-project` skill verbatim except the Node major.

### Compose — **DEVIATION from the current standard**

Both repos still use the **superseded `compose.example.*.yaml` convention**:

- Files on disk: `compose.example.yaml`, `compose.example.traefik.yaml`, `compose.example.cloudflared.yaml`.
- `.gitignore` contains `compose.yaml`.
- `.dockerignore` contains `compose.yaml` + `compose.example.*.yaml`.
- Every file's header comment says *"Copy this file to compose.yaml and run: docker compose up -d"*.
- The README documents `cp compose.example.traefik.yaml compose.yaml`.
- `.env.example` has **no `COMPOSE_FILE` block**.

The current standard (rules/docker.md § Compose files) is: commit `compose.yaml` / `compose.traefik.yaml` / `compose.cloudflared.yaml`, un-gitignore `compose.yaml`, and select the mode with a `COMPOSE_FILE=` line in `.env`. **The new site must not copy the `.example` naming.**

Everything *inside* the compose files is correct and should be copied verbatim (only rename the service and the host label). Port mode:

```yaml
services:
  regexp-cheminfo-org:
    # Use the released image by default. To build locally instead, run:
    #   docker compose up -d --build
    image: ghcr.io/cheminfo/regexp.cheminfo.org:latest
    build: .
    env_file: .env
    ports:
      - "${PORT:-8080}:80"
    init: true
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    mem_limit: 512m
    cpus: 0.5
    pids_limit: 256
    ulimits:
      core: 0
    logging:
      options:
        max-size: "5m"
        max-file: "3"
    restart: unless-stopped
```

Traefik mode adds `networks: [default, traefik]`, the five labels, and a top-level `networks: { traefik: { external: true } }`; the port label is always the container port `80`:

```yaml
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.regexp-cheminfo-org.rule=Host(`regexp.cheminfo.org`)'
      - 'traefik.http.routers.regexp-cheminfo-org.entrypoints=websecure'
      - 'traefik.http.routers.regexp-cheminfo-org.tls.certresolver=letsencrypt'
      - 'traefik.http.services.regexp-cheminfo-org.loadbalancer.server.port=80'
```

Cloudflared mode drops `ports:` and adds the sidecar (the sanctioned `128m` exception), with the dashboard walkthrough in the header comment:

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    env_file: .env
    init: true
    read_only: true
    security_opt: [no-new-privileges:true]
    cap_drop: [ALL]
    mem_limit: 128m
    cpus: 1
    pids_limit: 64
    ulimits: { core: 0 }
    logging: { options: { max-size: "5m", max-file: "2" } }
    restart: unless-stopped
```

Hardening audit: `init`, `read_only`, `no-new-privileges`, `cap_drop: ALL`, `ulimits.core: 0`, `restart: unless-stopped`, both `image:` and `build: .`, top-level `mem_limit`/`cpus`/`pids_limit` (no Swarm-only `deploy.resources`), no `ulimits.nproc`/`nofile`, no named volumes — **all clean in both repos**.

### GitHub workflows — four files, byte-identical across both repos

`nodejs.yml`:

```yaml
name: Node.js CI
on:
  push:
    branches: [main]      # (written as a block list)
  pull_request:
jobs:
  nodejs:
    # Documentation: https://github.com/zakodium/workflows#nodejs
    uses: zakodium/workflows/.github/workflows/nodejs.yml@nodejs-v1
    with:
      disable-test-package: true
      lint-check-types: true
```

`release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    # Documentation: https://github.com/zakodium/workflows#release
    uses: zakodium/workflows/.github/workflows/release.yml@release-v1
    with:
      npm: false
    secrets:
      github-token: ${{ secrets.BOT_TOKEN }}
```

`docker-image.yml`:

```yaml
name: Docker image
on:
  push:
    tags: ['v*']
  workflow_dispatch:
jobs:
  docker-image:
    # Documentation: https://github.com/zakodium/workflows#docker-image
    uses: zakodium/workflows/.github/workflows/docker-image.yml@docker-image-v1
```

`e2e.yml` — the only hand-written workflow (there is no shared Playwright workflow):

```yaml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test-e2e
        env:
          CI: 'true'
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: |
            playwright-report
            test-results
          retention-days: 7
```

This matches the `add-tests` skill template exactly (minus the `frontend/` working-directory prefixes), but rules/github-actions.md requires `actions/setup-node@v7` in hand-written workflows — see §6.

There is **no `typedoc.yml` and no `lactame.yml`** in either repo, correctly: these are private apps, not published libraries.

---

## 6. What is outdated versus current cheminfo standards

Ordered by blast radius. Everything below applies to **both** repos unless noted.

**Must fix when copying**

1. **`compose.example.*.yaml` convention** — superseded. Commit `compose.yaml` / `compose.traefik.yaml` / `compose.cloudflared.yaml`; remove `compose.yaml` from `.gitignore`; replace the two `.dockerignore` compose lines with `compose*.yaml`; add the three commented `COMPOSE_FILE=` lines to `.env.example`; rewrite the README deployment section (`cp .env.example .env`, set `COMPOSE_FILE`, `docker compose up -d`) and drop every `cp compose.example.* compose.yaml` instruction and every "Copy this file to compose.yaml" header comment.
2. **ESLint and Prettier scoped to `src`** — `"eslint": "eslint src"`, `"prettier": "prettier --check src"`. rules/tooling.md is explicit: lint and format the **whole repo** (`eslint .`, `prettier --check .`); `globalIgnores` and `.prettierignore` already handle generated output. As written, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, the workflows, README and compose files are never linted or format-checked.
3. **Wrong ESLint config family** — `eslint-config-cheminfo-typescript` + `eslint-config-cheminfo-react`. These are deployed **apps** (`private: true`, no `exports`, no `prepack`), so rules/tooling.md § ESLint config packages puts them on the **`eslint-config-zakodium`** family (`/ts`, `/unicorn`, `/react`), one devDependency instead of two, passed directly to `defineConfig` (no `...` spread — note the current `...cheminfoTs` spread).
4. **`unicorn` config missing entirely** — the standard React frontend stack is `ts, unicorn, react`. Neither repo loads `eslint-config-zakodium/unicorn` (or a cheminfo equivalent).
5. **React 18** — `react ^18.3.1` / `react-dom ^18.3.1` / `@types/react ^18.3.28` / `@types/react-dom ^18.3.7` (18.3.1 installed). Current standard is React **19** (`^19.2.5`, types `^19.2.14` / `^19.2.3`).
6. **`Dockerfile` on `node:22-alpine`** — must be `node:24-alpine` (rules/docker.md § Node.js base image; verify the LTS major hasn't moved to 26 before scaffolding, October 2026 is the switch point).
7. **Frontend `tsconfig.json` shape** — uses `@zakodium/tsconfig` + hand-written `jsx`/`lib`/`outDir: dist`. rules/typescript.md § Frontend tsconfig requires `@zakodium/tsconfig/jsx` + `noEmit: true` + `noUncheckedIndexedAccess: true`, `include: ["src", "vite*.ts"]` — the `/jsx` entry already supplies `jsx` and the DOM libs, and Vite (not `tsc`) emits the build so `outDir` is wrong.
8. **`actions/setup-node@v4` in `e2e.yml`** — rules/github-actions.md § Node.js version requires `actions/setup-node@v7` for any hand-written workflow (the `node-version: '24'` is already right). `actions/checkout@v4` and `actions/upload-artifact@v4` should be bumped to current majors at the same time. Note this is also what the `add-tests` skill template ships, so the skill and the rule currently disagree — the rule wins.

**Should fix / decide deliberately**

9. **No signals global state** — rules/react.md § State management makes `@preact/signals-react` with `data` / `preferences` / `view` buckets in `src/state/` mandatory for every React app, read via `useSignals()` as the first line of each component. Both sites use per-page `useState` plus hand-rolled localStorage helpers. The pedagogic per-exercise `StateMap` pattern is fine and prescribed by rules/pedagogic-tools.md, but the *global* view state (active tab, active exercise id, playground contents) belongs in the signals buckets, with `preferences` persisted via `persistBucket` rather than the ad-hoc `readJson`/`writeJson` pair.
10. **`components/` is flat, not per-page** — rules/react.md § Frontend structure asks for one folder per page plus `components/shared/`. 14 flat components in regexp, 8 in iupac.
11. **No `react-doctor` evidence** — rules/react.md makes `npx react-doctor@latest` mandatory for React projects; nothing in either repo records a clean scan.
12. **`iupac` deps out of alphabetical order and containing a `file:` path dep** — `"iupac-names": "file:../structure-to-name/packages/iupac-names"` sits last in `dependencies`. This breaks `npm ci` in the Docker builder (the path is outside the build context) and is non-reproducible. Never replicate.
13. **`iupac` ships no `public/`** while `index.html` links `/favicon.svg` → 404 on the live site. regexp is correct (`public/favicon.svg`, `public/epfl-logo.svg`).
14. **`iupac` has no `CHANGELOG.md`** — release-please has not cut a release there yet; `"version": "1.0.0"` was hand-set in `package.json`, which rules/git.md forbids. A new project starts at `"version": "0.0.0"` and lets release-please own it.
15. **`.gitignore` lacks `.env.*` / keeps `compose.yaml`** — the only content issue is the `compose.yaml` line (item 1). `.claude` and `coverage` are present, as required.
16. **Coverage provider** — both on `v8`. iupac loads `openchemlib` in its unit tests, which is exactly the "heavy dependency being profiled" case rules/testing.md flags for `istanbul` (~8x). For equilibrium, stay on `v8` unless OCL or a comparably heavy library is loaded in tests — and if switching an existing project, prompt first.
17. **No `docs/` convention and no `.claude/prompts.log` in-repo** — both have an empty `.claude/` dir (gitignored). Fine, just noting it.

**Correct as-is — copy without hesitation**

`.prettierrc.json` (exact standard five keys); `.npmrc` (`ignore-scripts=true`); `vitest.config.ts` (coverage include covering `.tsx`, `snapshotFormat.maxOutputLength`, explicit `include` keeping Playwright specs out); `playwright.config.ts`; `vite.config.ts`; the three shared zakodium workflows with `disable-test-package: true` + `lint-check-types: true` and `npm: false` + `BOT_TOKEN`; the whole container-hardening block; the static-web-server runtime with `SERVER_FALLBACK_PAGE`; `type: module` + `private: true`; `main` as the default branch; MIT `LICENSE`; alphabetical scripts with the standard names.