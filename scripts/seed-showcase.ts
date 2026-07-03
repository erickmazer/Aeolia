/**
 * Semeia a biblioteca de vitrine (a sua) com as 13 músicas curadas.
 * Usa a service-role key (ignora RLS), então roda só localmente/no seu terminal.
 *
 * Pré-requisitos: já ter feito login uma vez (pra existir seu profile) e saber
 * seu user id (Supabase → Authentication → Users).
 *
 * Rodar:
 *   export NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=eyJ...        # NUNCA commite/exponha esta chave
 *   export SHOWCASE_USER_ID=<seu-user-uuid>
 *   bun run scripts/seed-showcase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { SEED_SONGS } from '../app/biblioteca/_lib/seed-songs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = process.env.SHOWCASE_USER_ID

if (!url || !serviceKey || !userId) {
  console.error('Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SHOWCASE_USER_ID')
  process.exit(1)
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  // Marca a conta como vitrine pública.
  const { error: profErr } = await db.from('profiles').update({ is_showcase: true }).eq('id', userId)
  if (profErr) throw profErr

  // Passo 1: insere as músicas (sem os links) e coleta slug → uuid.
  const slugToId: Record<string, string> = {}
  for (const s of SEED_SONGS) {
    const { data, error } = await db
      .from('songs')
      .insert({
        user_id: userId,
        title: s.title,
        artist: s.artist,
        difficulty: s.difficulty,
        status: s.status,
        techniques: s.techniques,
        contexts: s.contexts,
        best_version_label: s.bestVersion?.label ?? null,
        best_version_url: s.bestVersion?.url ?? null,
        best_lesson_label: s.bestLesson?.label ?? null,
        best_lesson_url: s.bestLesson?.url ?? null,
        notes: s.notes ?? null,
      })
      .select('id')
      .single()
    if (error || !data) throw error ?? new Error('insert falhou')
    slugToId[s.id] = data.id
  }

  // Passo 2: resolve prerequisites/nextSongs (slugs → uuids).
  for (const s of SEED_SONGS) {
    const prerequisite_ids = s.prerequisites.map((x) => slugToId[x]).filter(Boolean)
    const next_song_ids = s.nextSongs.map((x) => slugToId[x]).filter(Boolean)
    if (prerequisite_ids.length || next_song_ids.length) {
      const { error } = await db
        .from('songs')
        .update({ prerequisite_ids, next_song_ids })
        .eq('id', slugToId[s.id])
      if (error) throw error
    }
  }

  console.log(`Semeadas ${SEED_SONGS.length} músicas na vitrine (user ${userId}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
