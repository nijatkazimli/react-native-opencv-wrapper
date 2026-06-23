/** @type {import('jest').Config} */
export const testEnvironment = "node";
export const roots = ["<rootDir>/src"];
export const testMatch = ["**/__tests__/**/*.test.ts"];
export const moduleFileExtensions = ["ts", "tsx", "js", "json"];
export const transform = {
  "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
};
export const collectCoverageFrom = [
  "src/**/*.{ts,tsx}",
  "!src/**/__tests__/**",
  "!src/**/*.d.ts",
  "!src/index.tsx",
  "!src/core/state.ts",
  "!src/NativeReactNativeOpencvWrapper.ts",
];
export const coverageDirectory = "coverage";
export const coverageReporters = ["text", "text-summary", "lcov"];
export const coverageThreshold = {
  global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
};
