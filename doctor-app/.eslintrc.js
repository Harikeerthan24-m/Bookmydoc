module.exports = {
  parser: '@babel/eslint-parser',
  extends: [
    'plugin:prettier/recommended',
    'prettier'
  ],
  plugins: ['prettier'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'prettier/prettier': 'error',
  },
};