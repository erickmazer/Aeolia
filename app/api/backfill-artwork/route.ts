import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Quantas músicas processar por chamada. Mantém abaixo do limite da Apple
// (~20 req/min/IP) e o botão é repetível até zerar.
const PER_RUN = 18

interface CanonRow {
  id: string
  title: string
  artist: string
}

/**
 * Backfill de capas: preenche a arte das músicas canônicas que ainda não têm,
 * buscando no iTunes. Só o dono (profiles.is_showcase) pode rodar; a escrita
 * passa pela RPC `set_canonical_artwork` (security definer, fill-only). Chamar
 * em lotes até `remaining` zerar.
 */
export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 })
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('is_showcase')
    .eq('id', user.id)
    .maybeSingle()
  if (!prof?.is_showcase) {
    return NextResponse.json({ error: 'Só o dono pode preencher capas.' }, { status: 403 })
  }

  const { data: rows } = await supabase
    .from('canonical_songs')
    .select('id, title, artist')
    .is('artwork', null)
    .limit(PER_RUN)
  const list = (rows ?? []) as CanonRow[]

  let updated = 0
  for (const s of list) {
    try {
      const term = encodeURIComponent(`${s.title} ${s.artist}`)
      const res = await fetch(
        `https://itunes.apple.com/search?media=music&entity=song&limit=1&term=${term}`,
        { headers: { accept: 'application/json' } },
      )
      if (!res.ok) continue
      const data = (await res.json().catch(() => ({}))) as { results?: { artworkUrl60?: string }[] }
      const art = data.results?.[0]?.artworkUrl60
      if (!art) continue
      const { error } = await supabase.rpc('set_canonical_artwork', { _song_id: s.id, _artwork: art })
      if (!error) updated++
    } catch {
      // pula esta música; segue o lote
    }
  }

  const { count: remaining } = await supabase
    .from('canonical_songs')
    .select('id', { count: 'exact', head: true })
    .is('artwork', null)

  return NextResponse.json({ updated, scanned: list.length, remaining: remaining ?? null })
}
