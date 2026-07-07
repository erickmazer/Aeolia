import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aeolia',
    short_name: 'Aeolia',
    description: 'Your musical journey — practice and track your progress.',
    start_url: '/practice',
    display: 'standalone',
    background_color: '#1c1a17',
    theme_color: '#1c1a17',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
