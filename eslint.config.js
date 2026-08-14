import { defineConfig, globalIgnores } from 'eslint/config';
import cheminfoReact from 'eslint-config-cheminfo-react';
import cheminfoTs from 'eslint-config-cheminfo-typescript';

export default defineConfig(
  globalIgnores([
    '**/coverage',
    '**/dist',
    '**/lib',
    '**/node_modules',
    '**/playwright-report',
    '**/test-results',
    // Snapshots of the visualizer views being replaced; kept verbatim.
    'reference',
    // Runnable snippets from the README, kept as plain scripts.
    'packages/chem-equilibrium/examples',
  ]),
  ...cheminfoTs,
  {
    // The `source` fields of the database are citations, recorded exactly as
    // the upstream table has them. www.ars-chemia.net serves no HTTPS at all,
    // so rewriting the scheme turns a working reference into a dead link.
    files: ['packages/chem-equilibrium/src/data/database.ts'],
    rules: { 'unicorn/prefer-https': 'off' },
  },
  {
    files: ['packages/equilibrium.cheminfo.org/**/*.{ts,tsx}'],
    extends: cheminfoReact,
  },
);
