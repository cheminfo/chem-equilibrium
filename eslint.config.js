import { defineConfig, globalIgnores } from 'eslint/config';
import ts from 'eslint-config-cheminfo-typescript';

export default defineConfig(
  globalIgnores([
    'coverage',
    'dist',
    'lib',
    'node_modules',
    // Runnable snippets from the README, kept as plain scripts.
    'examples',
  ]),
  ts,
  {
    // The `source` fields of the database are citations, recorded exactly as
    // the upstream table has them. www.ars-chemia.net serves no HTTPS at all,
    // so rewriting the scheme turns a working reference into a dead link.
    files: ['src/data/database.ts'],
    rules: { 'unicorn/prefer-https': 'off' },
  },
);
