const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'plugin:node/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    'linebreak-style': OFF,
    'class-methods-use-this': OFF,
    'import/prefer-default-export': OFF,
    'no-multiple-empty-lines': [ERROR, { max: 2 }],
    '@typescript-eslint/lines-between-class-members': OFF,
    'max-classes-per-file': OFF,
    'no-restricted-syntax': [ERROR,
      {
        'selector': 'ForInStatement',
        'message': 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        'selector': 'LabeledStatement',
        'message': 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        'selector': 'WithStatement',
        'message': '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'max-len': [OFF,
      {
        'code': 140,
        'tabWidth': 2,
        'ignoreUrls': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true,
        'ignoreRegExpLiterals': true,
      },
    ],
    'object-curly-newline': OFF,
    'no-plusplus': OFF,
    'no-undef-init': OFF,
    '@typescript-eslint/no-use-before-define': [ERROR,
      {
        'functions': false,
      },
    ],
    'no-async-promise-executor': OFF,
    'no-await-in-loop': OFF,
    'no-irregular-whitespace': OFF,
    '@typescript-eslint/naming-convention': OFF,
    'quote-props': OFF,
    '@typescript-eslint/no-unused-vars': OFF,
    'no-continue': OFF,
    'no-process-exit': OFF,
    'for-direction': OFF,
    'node/no-unpublished-import': OFF,
    'prefer-destructuring': OFF,
    'no-mixed-operators': OFF,
    '@typescript-eslint/dot-notation': OFF,

    // Typescript handles these
    'no-undef': OFF,
    'node/no-missing-import': OFF,
    'node/no-unsupported-features/es-syntax': OFF,
  },
};
