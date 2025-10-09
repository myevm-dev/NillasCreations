import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Next.js + TS base
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Project rules
  {
    rules: {
      // ⬇️ allow apostrophes in JSX text
      "react/no-unescaped-entities": "off",
      // ⬇️ don't block builds on unused vars; allow _prefixed ignores
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    },
  },

  // Ignores
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];