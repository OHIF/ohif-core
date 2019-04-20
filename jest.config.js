module.exports = {
  verbose: true,
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  testMatch: ["<rootDir>/src/**/*.test.js"],
  //
  collectCoverage: false,
  collectCoverageFrom: ["**/*.{js,jsx}", "!**/node_modules/**"]
};