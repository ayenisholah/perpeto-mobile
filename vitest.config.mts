import { defineConfig } from "vitest/config";

/**
 * Tests run in Node against the platform-independent logic modules. React
 * Native components (`.tsx`) are not executable here, so coverage is scoped to
 * `.ts` sources. The thresholds are a ratchet: raise them as coverage grows,
 * never lower them.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/**/*.d.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 82, statements: 80, branches: 79, functions: 74 },
    },
  },
});
