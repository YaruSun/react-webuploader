module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: 'airbnb',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'no-console': 'off',
    'react/jsx-filename-extension': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'func-names': 'off',
    'consistent-return': 'off'
  },
};
