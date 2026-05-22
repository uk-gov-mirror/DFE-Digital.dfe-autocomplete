// Standalone ESLint config — runs only via `npm run lint:exports`.
// The `standard` CLI cannot take custom rules, so this enforces the
// house convention (all exports in one block at the bottom of the file)
// on its own. Invoked with --no-eslintrc so it never merges with anything.
module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  plugins: ['import'],
  rules: {
    'import/exports-last': 'error',
    'import/group-exports': 'error'
  }
}
