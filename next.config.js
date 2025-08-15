/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force cache busting on deployments
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Disable service worker caching for development
  swcMinify: true,
}

module.exports = nextConfig
