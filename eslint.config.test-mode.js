import js from '@eslint/js';
import globals from 'globals';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import path from 'path';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  { ignores: ['dist'] },
  // Regular JS/TS files

  {
    extends: [],
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/*.config.ts',
      '**/*.test.ts',
      '**/components/ui/**/*.tsx',
      '**/sdk/**/*.ts',
      '**/test/**/*.{ts,tsx}',
      '**/types/**/*.{ts,tsx}',
      '**/hooks/**/*.{ts,tsx}',
      '**/vite-env.d.ts',
      '**/product-types.ts',
      'dist',
      'node_modules',
      '*.d.ts',
      '*.d.tsx',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        require: 'readonly',
        NodeJS: true,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    // settings: {
    //   'import/resolver': {
    //     typescript: {
    //       project: './tsconfig.app.json',
    //     },
    //   },
    // },
    rules: {
      //'react-hooks/rules-of-hooks': 'error',
      //'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="require"]',
          message:
            'require is not allowed. use ES modules (import/export) instead of require().',
        },
      ],
      // 'import/named': 'error', // catches missing exports
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false },
      ],
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
  },
  // Config files without type checking
  {
    files: ['**/*.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      parser: tseslint.parser,
      parserOptions: {
        project: null,
      },
    },
  },
);
