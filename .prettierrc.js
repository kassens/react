'use strict';

const {esNextPaths} = require('./scripts/shared/pathsByLanguageVersion');

module.exports = {
  plugins: ['prettier-plugin-hermes-parser'],
  bracketSpacing: false,
  singleQuote: true,
  bracketSameLine: true,
  trailingComma: 'es5',
  printWidth: 80,
  parser: 'hermes',
  arrowParens: 'avoid',
  overrides: [
    {
      files: ['*.code-workspace'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: esNextPaths,
      options: {
        trailingComma: 'all',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        trailingComma: 'all',
        parser: 'typescript',
      },
    },
    {
      files: [
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/destructuring-mixed-scope-and-local-variables-with-default.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/destructuring-mixed-scope-declarations-and-locals.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/error.todo-kitchensink.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/hook-inside-logical-expression.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/optional-call-logical.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/readonly-object-method-calls-mutable-lambda.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/readonly-object-method-calls.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/tagged-template-in-hook.js',
        'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/tagged-template-literal.js',
      ],
      options: {
        parser: 'flow',
      },
    },
  ],
};
