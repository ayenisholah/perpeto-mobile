const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

/**
 * Lint is a build gate: `npm run lint` runs with `--max-warnings=0`, so every
 * rule below is an error in practice. The type-aware rules use the TypeScript
 * project service, so they see the same types as `tsc`.
 */
module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [".expo/**", "coverage/**", "dist/**", "vendor/**", "**/*.d.ts"],
  },
  {
    // Node-run tooling: this config and the build scripts.
    files: ["eslint.config.js", "scripts/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: { __dirname: "readonly", module: "writable", process: "readonly", require: "readonly" },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Unhandled promises are how failures go silent; mark intentional
      // fire-and-forget calls with `void`.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "all", caughtErrorsIgnorePattern: "^_" },
      ],
      "react-hooks/exhaustive-deps": "error",
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
]);
