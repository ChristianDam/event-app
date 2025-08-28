/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Global test configuration
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.d.ts",
        "**/__tests__/**",
        "**/coverage/**",
        "**/vite.config.*",
        "**/vitest.config.*",
        "**/.{idea,git,cache,output,temp}/**",
      ],
    },
    // Environment configuration for different test patterns
    environmentMatchGlobs: [
      // Frontend tests - React components, hooks, utilities
      ["**/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", "jsdom"],
      // Backend tests - Convex functions  
      ["**/convex/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}", "edge-runtime"],
    ],
    // Fallback environment for tests that don't match patterns above
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    server: { 
      deps: { 
        inline: ["convex-test"] 
      } 
    },
    // Test timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
