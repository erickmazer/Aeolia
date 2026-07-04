/**
 * Semeia o catálogo canônico com as músicas curadas e cria a biblioteca da
 * conta de vitrine (a sua), com a árvore de evolução pessoal.
 *
 * Usa a service-role key (ignora RLS) — roda só localmente/no seu terminal.
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
import { SEED_SONGS } from '../lib/library/seed-songs'

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

  // Passo 1: upsert das músicas canônicas (dedup por dedup_key) → slug → uuid.
  const slugToId: Record<string, string> = {}
  for (const s of SEED_SONGS) {
    const { data, error } = await db
      .from('canonical_songs')
      .upsert(
        {
          title: s.title,
          artist: s.artist,
          difficulty: s.difficulty,
          techniques: s.techniques,
          contexts: s.contexts,
          best_version_label: s.bestVersion?.label ?? null,
          best_version_url: s.bestVersion?.url ?? null,
          best_lesson_label: s.bestLesson?.label ?? null,
          best_lesson_url: s.bestLesson?.url ?? null,
          notes: s.notes ?? null,
        },
        { onConflict: 'dedup_key' },
      )
      .select('id')
      .single()
    if (error || !data) throw error ?? new Error('upsert canônico falhou')
    slugToId[s.id] = data.id
  }

  // Passo 2: cria a entrada da vitrine pra cada música (status curado).
  for (const s of SEED_SONGS) {
    const { error } = await db
      .from('library_entries')
      .upsert(
        { user_id: userId, song_id: slugToId[s.id], status: s.status },
        { onConflict: 'user_id,song_id' },
      )
    if (error) throw error
  }

  // Passo 3: árvore pessoal do showcase (slugs → uuids canônicos) na entrada.
  for (const s of SEED_SONGS) {
    const prerequisite_song_ids = s.prerequisites.map((x) => slugToId[x]).filter(Boolean)
    const next_song_ids = s.nextSongs.map((x) => slugToId[x]).filter(Boolean)
    if (prerequisite_song_ids.length || next_song_ids.length) {
      const { error } = await db
        .from('library_entries')
        .update({ prerequisite_song_ids, next_song_ids })
        .eq('user_id', userId)
        .eq('song_id', slugToId[s.id])
      if (error) throw error
    }
  }

  console.log(`Semeadas ${SEED_SONGS.length} músicas canônicas + biblioteca da vitrine (user ${userId}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
