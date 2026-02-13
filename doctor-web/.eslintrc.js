module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'react-refresh'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist/',
    'build/',
    'node_modules/',
    'ui/build/',
    'ui/dist/',
    'coverage/',
    '*.min.js',
    '*.min.ts',
    'ui/public/**/*',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    'react-refresh/only-export-components': 'error',
    'unicorn/no-null': 'off',
    'unicorn/no-process-exit': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['interface', 'typeAlias'],
        format: ['PascalCase'],
        prefix: ['I'],
      },
    ],
  },
};
