// Camada de dados da Biblioteca (server-only).
// Lê da view canônica + entradas pessoais; cai na semente quando não configurado.

import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import type { Song, Status, Difficulty, TechniqueId, ContextId, Section } from './data'
import { SEED_SONGS } from './seed-songs'

// Uma library_entry com a música canônica embutida (join via FK song_id).
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

interface EntryRow {
  id: string
  status: string
  personal_note: string | null
  prerequisite_song_ids: string[] | null
  next_song_ids: string[] | null
  sections: Section[] | null
  canonical: CanonicalRow | null
}

const ENTRY_SELECT =
  'id, status, personal_note, prerequisite_song_ids, next_song_ids, sections, canonical:canonical_songs(*)'

function entryToSong(e: EntryRow): Song | null {
  const c = e.canonical
  if (!c) return null
  return {
    id: c.id,
    title: c.title,
    artist: c.artist,
    difficulty: c.difficulty as Difficulty,
    status: e.status as Status,
    techniques: (c.techniques ?? []) as TechniqueId[],
    contexts: (c.contexts ?? []) as ContextId[],
    prerequisites: e.prerequisite_song_ids ?? [],
    nextSongs: e.next_song_ids ?? [],
    bestVersion: c.best_version_url
      ? { label: c.best_version_label ?? 'ouvir', url: c.best_version_url }
      : undefined,
    bestLesson: c.best_lesson_url
      ? { label: c.best_lesson_label ?? 'estudar', url: c.best_lesson_url }
      : undefined,
    notes: c.notes ?? undefined,
    entryId: e.id,
    personalNote: e.personal_note ?? undefined,
    sections: e.sections ?? [],
  }
}

function sortSongs(songs: Song[]): Song[] {
  return songs.sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title))
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
    .from('library_entries')
    .select(ENTRY_SELECT)
    .eq('user_id', showcase.id)

  const songs = ((data ?? []) as unknown as EntryRow[])
    .map(entryToSong)
    .filter((s): s is Song => s !== null)
  return sortSongs(songs)
}

/** Músicas do usuário logado. Retorna null se não estiver logado. */
export async function getMySongs(): Promise<Song[] | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('library_entries')
    .select(ENTRY_SELECT)
    .eq('user_id', user.id)

  const songs = ((data ?? []) as unknown as EntryRow[])
    .map(entryToSong)
    .filter((s): s is Song => s !== null)
  return sortSongs(songs)
}
