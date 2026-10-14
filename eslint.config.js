import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node } },
    plugins: { react, 'unused-imports': unusedImports },
    rules: {
      'no-undef': js.configs.recommended.rules['no-undef'],
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'unused-imports/no-unused-imports': 'error',
    },
  },
];
