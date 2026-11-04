// ESLint flat config (ESLint 9+). `next lint` was removed in Next 16, so ESLint
// runs directly with Next's shared rule sets.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'public/sw.js']),
  {
    files: ['jest.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
