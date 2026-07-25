module.exports = {
  'app/src/**/*.{ts,tsx}': [
    () => 'npm run typecheck',
    () => 'npm run test'
  ]
};
