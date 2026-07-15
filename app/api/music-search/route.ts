import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export interface MusicSearchResult {
  title: string
  artist: string
  artwork: string | null
  genre: string | null
}

interface ITunesTrack {
  trackName?: string
  artistName?: string
  artworkUrl60?: string
  primaryGenreName?: string
}

// Cache em memória por query (curto): reduz chamadas repetidas à Apple entre
// digitações e usuários. O CDN da Vercel cacheia por mais tempo via headers.
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; results: MusicSearchResult[] }>()

function mapResults(tracks: ITunesTrack[]): MusicSearchResult[] {
  const seen = new Set<string>()
  const out: MusicSearchResult[] = []
  for (const t of tracks) {
    const title = t.trackName?.trim()
    const artist = t.artistName?.trim()
    if (!title || !artist) continue
    const key = `${title.toLowerCase()} ${artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      title,
      artist,
      artwork: t.artworkUrl60 ?? null,
      genre: t.primaryGenreName ?? null,
    })
  }
  return out
}

/**
 * Proxy de busca de músicas (autocomplete ao adicionar). Protegida (só logado,
 * espelha /api/generate) pra não virar proxy aberto. Fonte: iTunes Search API
 * (keyless). Faz dedupe por título+artista e cacheia por query.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para buscar músicas.' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ error: 'Busca muito curta.' }, { status: 400 })
  }

  const cacheKey = q.toLowerCase()
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(
      { results: hit.results },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate' } },
    )
  }

  try {
    const url =
      'https://itunes.apple.com/search?media=music&entity=song&limit=8&term=' +
      encodeURIComponent(q)
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Busca indisponível no momento.' }, { status: 502 })
    }
    const data = (await res.json().catch(() => ({}))) as { results?: ITunesTrack[] }
    const results = mapResults(data.results ?? [])
    cache.set(cacheKey, { at: Date.now(), results })
    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate' } },
    )
  } catch {
    return NextResponse.json({ error: 'Busca indisponível no momento.' }, { status: 502 })
  }
}
