import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,

  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**'],
  },

  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
      security: security,
    },
    rules: {
      // Prevent unused variables
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',

      // Console control
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Import order
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Security rules
      'security/detect-object-injection': 'warn',

      // Code quality
      eqeqeq: ['error', 'always'],
      curly: 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // Typescript strictness
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',

      // Best practices
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
    },
  },
];
