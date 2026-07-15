'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Library } from './library'
import { AddSong } from './add-song'
import type { Song, Difficulty, TechniqueId, Section, Material } from '@/lib/library/data'
import { sectionsFromDraft, type FicheDraft } from '@/lib/library/fiche-ai'
import type { SongFit, Suggestion, PersonalizationResult } from '@/lib/library/personalization'
import { Loading } from '@/components/app/spinner'

const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

export function PersonalLibrary({
  initialSongs,
  materialsByEntry,
}: {
  initialSongs: Song[]
  materialsByEntry?: Record<string, Material[]>
}) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)
  const [fit, setFit] = useState<Record<string, SongFit>>({})
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [pState, setPState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pError, setPError] = useState<string | null>(null)
  const [addingKey, setAddingKey] = useState<string | null>(null)

  async function handleDelete(song: Song) {
    if (!song.entryId) return
    if (!window.confirm(`Remover "${song.title}" da sua biblioteca?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('library_entries').delete().eq('id', song.entryId)
    if (!error) setSongs((cur) => cur.filter((s) => s.entryId !== song.entryId))
  }

  // Atualiza as partes/seções da música (progresso) e persiste na entry.
  async function handleSectionsChange(song: Song, sections: Section[]) {
    if (!song.entryId) return
    setSongs((cur) => cur.map((s) => (s.entryId === song.entryId ? { ...s, sections } : s)))
    const supabase = createClient()
    await supabase.from('library_entries').update({ sections }).eq('id', song.entryId)
  }

  // Adiciona uma música (título+artista): reusa o fluxo de dedup/gerar + RPC.
  async function addByTitleArtist(title: string, artist: string): Promise<Song> {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error ?? `Erro ${res.status}`)

    const supabase = createClient()
    if (payload.existing && payload.song) {
      const song = payload.song as Song
      const { data, error } = await supabase.rpc('add_existing_to_library', { _song_id: song.id }).single()
      const entry = data as { id: string } | null
      if (error || !entry) throw new Error(error?.message ?? 'Falha ao adicionar.')
      return { ...song, status: 'quero-aprender', prerequisites: [], nextSongs: [], entryId: entry.id }
    }

    const draft = payload.draft as FicheDraft
    const { data, error } = await supabase
      .rpc('create_canonical_and_add', {
        _title: draft.title,
        _artist: draft.artist,
        _difficulty: draft.difficulty,
        _techniques: draft.techniques,
        _genre: draft.genre,
        _best_version_label: draft.bestVersion?.label ?? null,
        _best_version_url: draft.bestVersion?.url ?? null,
        _best_lesson_label: draft.bestLesson?.label ?? null,
        _best_lesson_url: draft.bestLesson?.url ?? null,
        _notes: draft.notes || null,
        _sections: sectionsFromDraft(draft.sections),
      })
      .single()
    const entry = data as { id: string; song_id: string } | null
    if (error || !entry) throw new Error(error?.message ?? 'Falha ao salvar.')
    return {
      id: entry.song_id,
      title: draft.title,
      artist: draft.artist,
      difficulty: draft.difficulty as Difficulty,
      status: 'quero-aprender',
      techniques: draft.techniques as TechniqueId[],
      contexts: [],
      genre: draft.genre,
      prerequisites: [],
      nextSongs: [],
      bestVersion: draft.bestVersion,
      bestLesson: draft.bestLesson,
      notes: draft.notes || undefined,
      entryId: entry.id,
      sections: sectionsFromDraft(draft.sections),
    }
  }

  async function personalize() {
    setPState('loading')
    setPError(null)
    try {
      const res = await fetch('/api/personalize', { method: 'POST' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? `Erro ${res.status}`)
      const result = payload as PersonalizationResult
      setFit(result.perSong ?? {})
      setSuggestions(result.suggestions ?? [])
      setPState('idle')
    } catch (e) {
      setPError(e instanceof Error ? e.message : 'Falha ao personalizar.')
      setPState('error')
    }
  }

  async function acceptSuggestion(sug: Suggestion) {
    const key = `${sug.title}::${sug.artist}`
    setAddingKey(key)
    try {
      const song = await addByTitleArtist(sug.title, sug.artist)
      setSongs((cur) => [song, ...cur])
      setSuggestions((cur) => cur.filter((s) => `${s.title}::${s.artist}` !== key))
    } catch (e) {
      setPError(e instanceof Error ? e.message : 'Falha ao adicionar a sugestão.')
    } finally {
      setAddingKey(null)
    }
  }

  return (
    <div className="space-y-12">
      <AddSong onAdded={(song) => setSongs((cur) => [song, ...cur])} />

      {/* Próximas pra você (personalização por IA) */}
      <section aria-labelledby="proximas-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="proximas-title" className="font-serif text-2xl">Próximas pra você</h2>
          <button
            type="button"
            onClick={personalize}
            disabled={pState === 'loading'}
            className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-patina)' }}
          >
            {pState === 'loading' ? (
              <Loading>pensando…</Loading>
            ) : suggestions.length ? (
              'atualizar sugestões'
            ) : (
              'gerar sugestões'
            )}
          </button>
        </div>
        <p className="mb-5 max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
          A IA lê o que você já toca (nível, gosto, momento) e sugere próximas músicas — além de marcar
          a dificuldade relativa ao seu nível em cada música abaixo.
        </p>

        {pError && <p className="mb-4 text-sm text-[color:oklch(0.65_0.15_25)]">{pError}</p>}

        {/* Skeleton enquanto a IA pensa (1ª geração) — no lugar de tela vazia. */}
        {pState === 'loading' && suggestions.length === 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden>
            {[0, 1].map((i) => (
              <li key={i} className="rounded-lg border p-4" style={borderStyle}>
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-7 w-24 rounded-md" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {suggestions.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {suggestions.map((sug) => {
              const key = `${sug.title}::${sug.artist}`
              return (
                <li key={key} className="rounded-lg border p-4" style={borderStyle}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-[color:var(--color-paper)]">{sug.title}</span>
                    <span className="text-sm italic text-[color:var(--color-ash)]">{sug.artist}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-paper)]/75">{sug.rationale}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
                      alvo {sug.alvoDificuldade}/5
                    </span>
                    <button
                      type="button"
                      onClick={() => acceptSuggestion(sug)}
                      disabled={addingKey === key}
                      className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
                      style={{ background: 'var(--color-moss)' }}
                    >
                      {addingKey === key ? <Loading>adicionando…</Loading> : '+ adicionar'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Library
        songs={songs}
        editable
        onDelete={handleDelete}
        fit={fit}
        onSectionsChange={handleSectionsChange}
        materials={materialsByEntry}
      />
    </div>
  )
}
