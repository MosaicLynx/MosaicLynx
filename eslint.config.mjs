import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['apps/link-fallback/{scripts,test}/**/*.mjs'],
    languageOptions: { globals: { URL: 'readonly' } },
  },
  {
    files: ['apps/link-fallback/public/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        URLSearchParams: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    files: ['apps/mobile/*.config.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', module: 'readonly', require: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  }
);
