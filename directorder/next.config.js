/** @type {import('next').NextConfig} */
// If the app is served under a subpath (e.g. https://user.github.io/repo/), set in .env:
//   BASE_PATH=/repo
// Otherwise requests go to /_next/... at the domain root and CSS/JS 404 → página sin estilos.
const rawBase = process.env.BASE_PATH?.trim()
const basePath =
  rawBase && rawBase !== '/' ? rawBase.replace(/\/$/, '') : undefined

const nextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}
module.exports = nextConfig
