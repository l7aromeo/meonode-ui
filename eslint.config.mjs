import js from "@eslint/js";
import tsEslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import tsParser from '@typescript-eslint/parser'
import jsDoc from 'eslint-plugin-jsdoc'

const eslintConfig = [
  {
    ignores: ["**/dist/**", "**/build/**"], // Add other directories you wish to ignore
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
      jsDoc
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'error',
      'unusedImports/no-unused-imports': 'error',
      'unusedImports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'jsDoc/require-description': 'warn'
    },
  }
];

export default eslintConfig;
