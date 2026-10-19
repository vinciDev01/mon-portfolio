import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Les modules testes sont purs : aucun DOM necessaire.
    environment: "node",
    include: ["lib/**/*.test.ts"],
    // Fuseau fixe, hors UTC : un garde-fou qui ne mord que selon le reglage
    // de la machine n'est pas un garde-fou (dates analysees en UTC).
    env: { TZ: "America/Los_Angeles" },
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
});
