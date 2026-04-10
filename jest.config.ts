import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest for TypeScript
  preset: 'ts-jest',

  // Different environments for different test types
  projects: [
    // Unit tests (React components) — use jsdom
    {
      displayName: 'unit',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
      // setupFilesAfterSetup for testing-library/jest-dom — only when React component tests exist
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          jsx: 'react-jsx',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    // Integration tests (server actions, Supabase) — use node
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
