import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // Apply to all JS/JSX files in src/
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    settings: {
      react: {
        version: '18.2',
      },
    },
    rules: {
      // React rules - start with warnings for existing code
      'react/jsx-uses-vars': 'error', // Mark JSX component usage to avoid false unused-vars warnings
      'react/jsx-uses-react': 'off', // Not needed with React 17+ JSX transform
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/prop-types': 'off', // Not using PropTypes (using TypeScript for types)
      'react/jsx-key': 'warn', // Warn about missing keys in lists
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-children-prop': 'warn',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General JavaScript rules - relaxed for existing code
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_', // Allow underscore-prefixed catch clause variables
      }],
      'no-console': 'off', // Allow console for now
      'no-debugger': 'warn',
      'no-undef': 'error',
      'no-duplicate-imports': 'warn',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',

      // ==================================================================
      // SYSTEM ENFORCEMENT: No silent error swallowing
      // ==================================================================

      // Ban empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Custom rules to detect error-hiding patterns
      'no-restricted-syntax': [
        'error',
        {
          selector: 'BinaryExpression[operator="||"][right.raw="true"]',
          message:
            'SYSTEM BLOCK: The "|| true" pattern hides errors. Use proper error handling with reportError().',
        },
        {
          selector: 'CatchClause > BlockStatement[body.length=0]',
          message:
            'SYSTEM BLOCK: Empty catch blocks swallow errors. Use reportError() from @/lib/errorReporting.',
        },
      ],

      // Require catch clauses to have a parameter
      'no-ex-assign': 'error',

      // Disallow fallthrough in switch statements (common error source)
      'no-fallthrough': 'error',
    },
  },
  {
    // Storybook stories - relax rules-of-hooks for render functions
    files: ['src/**/*.stories.jsx', 'src/**/*.stories.js'],
    rules: {
      // Storybook's render() pattern uses hooks in a function named "render"
      // which triggers rules-of-hooks, but it's valid in Storybook context
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    // Configuration files (vite.config.js, etc.)
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
  },
  {
    // Ignore patterns
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**/*.js', // Static assets
      '.storybook/**', // Storybook config (has its own build process)
      'tests/**', // Test files (separate test runner)
    ],
  },
];
