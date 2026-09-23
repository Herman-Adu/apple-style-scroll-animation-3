import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

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
