import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Les modules testes sont purs : aucun DOM necessaire.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
