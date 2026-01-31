import { defineConfig } from 'eslint/config';
import mmm from '@jhwelch/mmm-eslint-config';
import html from '@html-eslint/eslint-plugin';

export default defineConfig([
  ...mmm.map(config => ({
    files: ['**/*.js', '**/*.mjs'],
    ...config,
  })),
  {
    files: ['**/*.html'],
    plugins: {
      html,
    },
    extends: ['html/recommended'],
    language: 'html/html',
    rules: {
      'html/no-duplicate-class': 'error',
      'html/indent': ['error', 2],
    },
  },
]);
