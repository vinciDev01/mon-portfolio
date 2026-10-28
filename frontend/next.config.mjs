import path from "node:path"
import { fileURLToPath } from "node:url"

// Les images televersees sont servies par le backend : on n'autorise que son
// adresse, lue dans NEXT_PUBLIC_API_URL, comme le reste du code.
const api = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Un serveur autonome (.next/standalone) pour l'image Docker. La racine du
  // tracage est celle du monorepo : les dependances y sont installees.
  output: "standalone",
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
  // Le paquet partage est du TypeScript brut (`main: ./src/index.ts`) avec un
  // module d'execution, `variantes.ts` : on le fait transpiler explicitement
  // plutot que de compter sur le comportement par defaut du bundler.
  transpilePackages: ["@portfolio/shared-types"],
  images: {
    remotePatterns: [
      {
        protocol: api.protocol.replace(":", ""),
        hostname: api.hostname,
        port: api.port,
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
}

export default nextConfig
