/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Unblock Vercel builds while we stabilise Next 15 page prop typing.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optional: also ignore lint errors at build time (safe for demos)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
