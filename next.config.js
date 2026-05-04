/** @type {import('next').NextConfig} */
// If the app is served under a subpath (e.g. https://user.github.io/repo/), set in .env:
//   BASE_PATH=/repo
// Otherwise requests go to /_next/... at the domain root and CSS/JS 404 → página sin estilos.
const rawBase = process.env.BASE_PATH?.trim()
const basePath =
  rawBase && rawBase !== '/' ? rawBase.replace(/\/$/, '') : undefined

if (typeof process !== 'undefined' && basePath) {
  // Si abrís http://localhost:3000/ sin el prefijo, el HTML puede verse pero CSS/JS van a 404.
  console.warn(
    `[DirectOrder] BASE_PATH="${basePath}" → en local usá: http://localhost:3000${basePath} (y dejá BASE_PATH vacío si querés la raíz /).`
  )
}

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
