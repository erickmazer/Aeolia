// Camada de dados da Biblioteca (server-only).
// Lê músicas do Supabase; cai na semente curada quando não configurado.

import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import type { Song, Status, Difficulty, TechniqueId, ContextId } from './data'
import { SEED_SONGS } from './seed-songs'

interface SongRow {
  id: string
  title: string
  artist: string
  difficulty: number
  status: string
  techniques: string[] | null
  contexts: string[] | null
  prerequisite_ids: string[] | null
  next_song_ids: string[] | null
  best_version_label: string | null
  best_version_url: string | null
  best_lesson_label: string | null
  best_lesson_url: string | null
  notes: string | null
}

function rowToSong(r: SongRow): Song {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    difficulty: r.difficulty as Difficulty,
    status: r.status as Status,
    techniques: (r.techniques ?? []) as TechniqueId[],
    contexts: (r.contexts ?? []) as ContextId[],
    prerequisites: r.prerequisite_ids ?? [],
    nextSongs: r.next_song_ids ?? [],
    bestVersion: r.best_version_url
      ? { label: r.best_version_label ?? 'ouvir', url: r.best_version_url }
      : undefined,
    bestLesson: r.best_lesson_url
      ? { label: r.best_lesson_label ?? 'estudar', url: r.best_lesson_url }
      : undefined,
    notes: r.notes ?? undefined,
  }
}

/** Usuário logado (ou null). */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Músicas da biblioteca de vitrine (a pública). Sem Supabase, retorna a
 * semente curada — assim a página nunca fica vazia durante o setup.
 */
export async function getShowcaseSongs(): Promise<Song[]> {
  if (!isSupabaseConfigured) return SEED_SONGS

  const supabase = await createClient()
  const { data: showcase } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_showcase', true)
    .limit(1)
    .maybeSingle()

  if (!showcase) return SEED_SONGS // ninguém marcado como vitrine ainda

  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', showcase.id)
    .order('difficulty', { ascending: true })

  return (data ?? []).map(rowToSong)
}

/** Músicas do usuário logado. Retorna null se não estiver logado. */
export async function getMySongs(): Promise<Song[] | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', user.id)
    .order('difficulty', { ascending: true })

  return (data ?? []).map(rowToSong)
}
