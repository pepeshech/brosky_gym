module.exports = {
  'src/**/*.{ts,tsx}': [
    () => 'npm run typecheck',
    () => 'npm run test'
  ]
};
