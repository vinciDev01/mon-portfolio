/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le paquet partage est du TypeScript brut (`main: ./src/index.ts`) avec un
  // module d'execution, `variantes.ts` : on le fait transpiler explicitement
  // plutot que de compter sur le comportement par defaut du bundler.
  transpilePackages: ["@portfolio/shared-types"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
}

export default nextConfig
