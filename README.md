# chem-equilibrium

Chemical equilibrium, solved and taught.

This repository holds two things:

| Package                                                                    | What it is                                                                                           |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`packages/chem-equilibrium`](./packages/chem-equilibrium)                 | The solver, published to npm as [`chem-equilibrium`](https://www.npmjs.com/package/chem-equilibrium) |
| [`packages/equilibrium.cheminfo.org`](./packages/equilibrium.cheminfo.org) | The teaching site at [equilibrium.cheminfo.org](https://equilibrium.cheminfo.org)                    |

The site explains how the solver works and offers six tools — a pH calculator,
an acid/base titration, an acid/base speciation diagram, a precipitation and
complexation diagram, a general equilibrium workbench and a set of pH exercises.
Every tool keeps its whole configuration in its URL, so any diagram or exercise
can be handed to a class as a link. It replaces six older cheminfo visualizer
views, whose snapshots and analysis are kept under [`reference/`](./reference).

## Getting started

```console
npm ci
npm run dev
```

`npm run dev` builds the library and starts the site on http://localhost:5173.

| Script                 | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run build`        | Build the library, then the site into `packages/equilibrium.cheminfo.org/dist` |
| `npm run build-bundle` | Build the browser bundle published to lactame.com                              |
| `npm run build-lib`    | Compile the library to `packages/chem-equilibrium/lib`                         |
| `npm run database`     | Regenerate the bundled data from the vendored tables                           |
| `npm run test`         | Tests, type-check, ESLint and Prettier over the whole repository               |
| `npm run test-e2e`     | Playwright end-to-end tests of the site                                        |

## Data

The formation constants and the pH-indicator transitions are vendored as
tab-separated tables next to the code that consumes them, so the repository — not
a spreadsheet someone may edit tomorrow — is the source of truth:

- `packages/chem-equilibrium/data/formation-constants.tsv`
- `packages/equilibrium.cheminfo.org/data/ph-indicators.tsv`

`npm run database` regenerates the TypeScript modules from them.
`node packages/chem-equilibrium/data/update.ts --fetch` reports how the vendored
table differs from the upstream spreadsheet without overwriting anything.
Everything in those tables — including which values have no documented source —
is visible and searchable on the site's **Data** page.

## Releasing

Versioning is driven by release-please from conventional commits, per package:

- a `chem-equilibrium-v*` tag publishes the library to npm, deploys the browser
  bundle to lactame.com and rebuilds the API documentation;
- an `equilibrium.cheminfo.org-v*` tag publishes the site's Docker image.

## Deployment

The site ships as a static Docker image. Copy `.env.example` to `.env`,
uncomment one `COMPOSE_FILE` line to pick how it is exposed, then:

```console
docker compose up -d
```

## License

[MIT](./LICENSE)
