import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { buildFichePrompt, ficheSchema, FICHE_MODEL } from '@/lib/library/fiche-ai'
import type { Song, Difficulty, TechniqueId, ContextId } from '@/lib/library/data'

export const runtime = 'nodejs'

interface CanonicalRow {
  id: string
  title: string
  artist: string
  difficulty: number
  techniques: string[] | null
  contexts: string[] | null
  best_version_label: string | null
  best_version_url: string | null
  best_lesson_label: string | null
  best_lesson_url: string | null
  notes: string | null
}

// Música canônica → Song (ainda sem entrada do usuário: status/relações vazios).
function canonicalToSong(c: CanonicalRow): Song {
  return {
    id: c.id,
    title: c.title,
    artist: c.artist,
    difficulty: c.difficulty as Difficulty,
    status: 'quero-aprender',
    techniques: (c.techniques ?? []) as TechniqueId[],
    contexts: (c.contexts ?? []) as ContextId[],
    prerequisites: [],
    nextSongs: [],
    bestVersion: c.best_version_url
      ? { label: c.best_version_label ?? 'ouvir', url: c.best_version_url }
      : undefined,
    bestLesson: c.best_lesson_url
      ? { label: c.best_lesson_label ?? 'estudar', url: c.best_lesson_url }
      : undefined,
    notes: c.notes ?? undefined,
  }
}

/**
 * Etapa 1 do fluxo de adicionar. Protegida (só logado).
 *  - Se a música já existe no banco canônico → devolve a ficha existente,
 *    SEM chamar a IA (`{ existing: true, song }`).
 *  - Senão → gera o rascunho por IA (`{ existing: false, draft }`) pro cliente
 *    revisar. A persistência acontece via RPC no cliente (nada é salvo aqui).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para gerar fichas.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string; artist?: string }
  const title = body.title?.trim()
  const artist = body.artist?.trim()
  if (!title || !artist) {
    return NextResponse.json({ error: 'Informe título e artista.' }, { status: 400 })
  }

  // Dedup: já existe no banco canônico?
  const { data: found } = await supabase.rpc('find_canonical', { _title: title, _artist: artist })
  const existing = Array.isArray(found) ? (found[0] as CanonicalRow | undefined) : undefined
  if (existing) {
    return NextResponse.json({ existing: true, song: canonicalToSong(existing) })
  }

  // Música nova → gera a ficha por IA.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' }, { status: 503 })
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: FICHE_MODEL,
      max_tokens: 1500,
      output_config: { format: { type: 'json_schema', schema: ficheSchema } },
      messages: [{ role: 'user', content: buildFichePrompt(title, artist) }],
    })

    const block = response.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: 'O modelo não retornou uma ficha.' }, { status: 502 })
    }
    return NextResponse.json({ existing: false, draft: JSON.parse(block.text) })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha ao gerar a ficha.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
