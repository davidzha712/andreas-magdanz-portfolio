import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "seed/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Minified third-party worker bundle shipped with react-pdf
    "public/pdf.worker.min.mjs",
    // Cloudflare Worker — separate project with its own tsconfig/runtime
    "cdn-proxy/**",
  ]),
]);

export default eslintConfig;
