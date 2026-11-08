import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['build', 'dist', 'node_modules', 'reference', 'tests/report', 'tests/gates/__out__', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Custom widgets carry their own roles and keyboard handling per the WAI-ARIA patterns.
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.ts', '*.config.{ts,js}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
