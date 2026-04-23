import js from '@eslint/js'
import tsEslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import tsParser from '@typescript-eslint/parser'
import jsDoc from 'eslint-plugin-jsdoc'
import { importX } from 'eslint-plugin-import-x'

const eslintConfig = [
  {
    ignores: ['**/dist/**', '**/build/**', 'tests/rsc-fixtures/**/.next/**', 'tests/rsc-fixtures/**/node_modules/**'],
  },
  jsDoc.configs['flat/stylistic-typescript'],
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2023,
      parser: tsParser,
    },
    plugins: {
      prettier,
      unusedImports,
      jsDoc,
      'import-x': importX,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'unusedImports/no-unused-imports': 'error',
      'unusedImports/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'jsDoc/require-description': 'warn',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'import-x/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          mjs: 'always',
          jsx: 'always',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@src/(?!.*\\.js$).+',
              message: 'Use .js extension for @src imports (e.g. @src/foo/bar.js).',
            },
          ],
        },
      ],
    },
  },
]

export default eslintConfig
