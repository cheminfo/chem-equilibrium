import { defineConfig, globalIgnores } from 'eslint/config';
import cheminfo from 'eslint-config-cheminfo';

export default defineConfig(
  globalIgnores(['coverage', 'dist', 'docs', 'examples']),
  cheminfo,
  {
    // Tool configs (eslint, vitest) are required to default-export.
    files: ['src/**', 'data/**'],
    rules: { 'import/no-default-export': 'error' },
  },
);
