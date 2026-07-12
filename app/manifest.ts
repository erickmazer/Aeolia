import type { MetadataRoute } from 'next'

// Cores em hex porque o manifest não aceita oklch. #1a1712 ≈ o --color-ink real
// (oklch(0.15 0.01 80)) definido em app/globals.css, que é a fonte de verdade.
const INK = '#1a1712'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aeolia',
    short_name: 'Aeolia',
    description: 'Biblioteca do Violonista — o mapa da sua jornada no violão.',
    start_url: '/',
    display: 'standalone',
    background_color: INK,
    theme_color: INK,
    icons: [
      // PNGs gerados por scripts/build-brand.mjs (tile Æ). O icon.svg fica como
      // fallback vetorial (herda enquanto os PNGs não existirem).
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
