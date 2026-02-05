// eslint.config.ts
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Ignore build output and dependencies
  {
    ignores: ["dist", "node_modules", "coverage"],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript base rules (non type-aware: no parserOptions.project)
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },

    rules: {
      // Let @typescript-eslint handle unused vars and allow _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
    },
  },
];
