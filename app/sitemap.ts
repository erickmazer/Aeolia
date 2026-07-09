import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://erickmazer.com'
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/musician/erick`, priority: 0.8 },
  ]
}
