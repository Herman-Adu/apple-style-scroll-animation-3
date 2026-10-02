import { readdirSync } from "node:fs"
import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

// A slice is reached through its public entries: `@/features/<slice>` (client-safe),
// `@/features/<slice>/actions` (server actions a client may call) or
// `@/features/<slice>/server` (server-only). Only the slice itself may reach inside.
const slices = readdirSync(new URL("./features", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const deepImportRule = (ownSlice) => [
  "error",
  {
    patterns: [
      {
        group: [
          "@/features/*/**",
          "!@/features/*/server",
          "!@/features/*/actions",
          ...(ownSlice ? [`!@/features/${ownSlice}/**`] : []),
        ],
        message:
          "Import from the slice's index (`@/features/<slice>`), its actions entry (`@/features/<slice>/actions`) or its server entry (`@/features/<slice>/server`).",
      },
    ],
  },
]

const sliceBoundaries = [
  { files: ["**/*.{ts,tsx}"], rules: { "no-restricted-imports": deepImportRule() } },
  ...slices.map((slice) => ({
    files: [`features/${slice}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": deepImportRule(slice) },
  })),
]

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Boundary code (Strapi adapters, media helpers) legitimately uses `any`
      // when mapping untyped external API responses — surface it, don't block.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // These are advisory for our intentional patterns (e.g. hydrating client
      // state from localStorage inside an effect). Keep them visible as warnings
      // rather than hard build failures.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
    },
  },
  ...sliceBoundaries,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "qa/**",
      "next-env.d.ts",
    ],
  },
]

export default eslintConfig
