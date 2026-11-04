// next/jest wires Jest to Next's SWC compiler, so TypeScript tests need no
// separate ts-jest/Babel setup and are compiled the same way as the app.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
});
