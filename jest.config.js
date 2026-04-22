const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import("jest").Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/tests/unit/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/tests/e2e/",
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
  ],
  passWithNoTests: true,
};

module.exports = createJestConfig(customJestConfig);
