import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { aiClient, generateStructured } from '@/lib/ai/client'
import { getMySongs } from '@/lib/library/queries'
import { deriveSignal } from '@/lib/library/signal'
import {
  buildPersonalizationPrompt,
  personalizationSchema,
  PERSONALIZATION_MODEL,
  type SongFit,
  type PersonalizationResult,
} from '@/lib/library/personalization'
import type { Song } from '@/lib/library/data'

export const runtime = 'nodejs'

/**
 * Personalização por IA: fit + dificuldade relativa por música e sugestões de
 * próximas. Protegida (só logado). Computa sob demanda e cacheia o fit por
 * música em library_entries.personalization (best-effort).
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' }, { status: 503 })
  }

  // Rate-limit (personalização é uma chamada de IA cara). Fail-open se a RPC não existir.
  const { data: allowed } = await supabase.rpc('rate_limit_ai', {
    _route: 'personalize',
    _max: 10,
    _window_secs: 3600,
  })
  if (allowed === false) {
    return NextResponse.json({ error: 'Muitas atualizações em pouco tempo. Tente daqui a pouco.' }, { status: 429 })
  }

  const songs = (await getMySongs()) ?? []
  const signal = deriveSignal(songs)

  try {
    const raw = await generateStructured<{
      perSong: SongFit[]
      suggestions: PersonalizationResult['suggestions']
    }>({
      client: aiClient(),
      model: PERSONALIZATION_MODEL,
      prompt: buildPersonalizationPrompt(signal, songs),
      schema: personalizationSchema,
      toolName: 'personalizar',
      toolDescription: 'Devolve o fit por música e as sugestões de próximas.',
      maxTokens: 2000,
    })

    const perSong: Record<string, SongFit> = {}
    for (const fit of raw.perSong ?? []) perSong[fit.songId] = fit

    // Cache best-effort: grava o fit em cada library_entry (RLS: só as suas).
    const byId = new Map<string, Song>(songs.map((s) => [s.id, s]))
    const now = new Date().toISOString()
    await Promise.all(
      Object.values(perSong).map((fit) => {
        const song = byId.get(fit.songId)
        if (!song?.entryId) return Promise.resolve()
        return supabase
          .from('library_entries')
          .update({ personalization: fit, personalization_at: now })
          .eq('id', song.entryId)
          .then(() => undefined)
      }),
    ).catch(() => {})

    const result: PersonalizationResult = { perSong, suggestions: raw.suggestions ?? [] }
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha ao personalizar.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
