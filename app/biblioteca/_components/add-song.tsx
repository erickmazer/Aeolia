'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TECHNIQUES,
  CONTEXTS,
  STATUSES,
  DIFFICULTY_LABELS,
  type Song,
  type Status,
  type Difficulty,
  type TechniqueId,
  type ContextId,
} from '../_lib/data'
import type { FicheDraft } from '../_lib/fiche-ai'

interface Draft extends FicheDraft {
  status: Status
}

type Phase = 'idle' | 'generating' | 'review' | 'saving'

const inputClass =
  'rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]'
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function AddSong({ userId, onAdded }: { userId: string; onAdded: (song: Song) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setArtist('')
    setDraft(null)
    setPhase('idle')
    setError(null)
    setOpen(false)
  }

  async function generate() {
    if (!title.trim() || !artist.trim()) return
    setPhase('generating')
    setError(null)
    try {
      const res = await fetch('/biblioteca/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`)
      const fiche = (await res.json()) as FicheDraft
      setDraft({ ...fiche, status: 'quero-aprender' })
      setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao gerar a ficha.')
      setPhase('idle')
    }
  }

  async function save() {
    if (!draft) return
    setPhase('saving')
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('songs')
        .insert({
          user_id: userId,
          title: draft.title,
          artist: draft.artist,
          difficulty: draft.difficulty,
          status: draft.status,
          techniques: draft.techniques,
          contexts: draft.contexts,
          best_version_label: draft.bestVersion?.label ?? null,
          best_version_url: draft.bestVersion?.url ?? null,
          best_lesson_label: draft.bestLesson?.label ?? null,
          best_lesson_url: draft.bestLesson?.url ?? null,
          notes: draft.notes || null,
        })
        .select('id')
        .single()
      if (dbError || !data) throw new Error(dbError?.message ?? 'Falha ao salvar.')

      onAdded({
        id: data.id,
        title: draft.title,
        artist: draft.artist,
        difficulty: draft.difficulty as Difficulty,
        status: draft.status,
        techniques: draft.techniques as TechniqueId[],
        contexts: draft.contexts as ContextId[],
        prerequisites: [],
        nextSongs: [],
        bestVersion: draft.bestVersion,
        bestLesson: draft.bestLesson,
        notes: draft.notes || undefined,
      })
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
      setPhase('review')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-4 py-3 text-sm text-[color:var(--color-paper)] transition-colors hover:border-[color:var(--color-patina)]"
        style={borderStyle}
      >
        + adicionar música por IA
      </button>
    )
  }

  return (
    <div className="rounded-lg border p-5" style={borderStyle}>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-lg">Adicionar por IA</h3>
        <button type="button" onClick={reset} className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] hover:text-[color:var(--color-paper)]">
          fechar
        </button>
      </div>

      {/* Entrada */}
      <div className="flex flex-wrap gap-2">
        <input className={inputClass} style={borderStyle} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} style={borderStyle} placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <button
          type="button"
          onClick={generate}
          disabled={phase === 'generating' || !title.trim() || !artist.trim()}
          className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
          style={{ background: 'var(--color-patina)' }}
        >
          {phase === 'generating' ? 'gerando…' : 'gerar ficha'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[color:oklch(0.65_0.15_25)]">{error}</p>}

      {/* Revisão */}
      {draft && phase !== 'generating' && (
        <div className="mt-6 space-y-5 border-t pt-5" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}>
          <p className="text-xs italic text-[color:var(--color-ash)]">
            Rascunho gerado por IA — revise antes de salvar (a IA pode errar dificuldade ou nota).
          </p>

          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
              Status
              <select
                className={inputClass}
                style={borderStyle}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
              Dificuldade
              <select
                className={inputClass}
                style={borderStyle}
                value={draft.difficulty}
                onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) as Difficulty })}
              >
                {([1, 2, 3, 4, 5] as const).map((d) => (
                  <option key={d} value={d}>{d} — {DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Técnicas</div>
            <div className="flex flex-wrap gap-2">
              {TECHNIQUES.map((t) => {
                const active = draft.techniques.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, techniques: toggle(draft.techniques, t.id) })}
                    className="rounded-full px-3 py-1 text-sm transition-colors"
                    style={{
                      color: active ? 'var(--color-ink)' : 'var(--color-paper)',
                      background: active ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-paper) 5%, transparent)',
                      border: `1px solid color-mix(in oklch, var(--color-ash) ${active ? 0 : 25}%, transparent)`,
                    }}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Contextos</div>
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((c) => {
                const active = draft.contexts.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, contexts: toggle(draft.contexts, c.id) })}
                    className="rounded-full px-3 py-1 text-sm transition-colors"
                    style={{
                      color: active ? 'var(--color-ink)' : 'var(--color-paper)',
                      background: active ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-paper) 5%, transparent)',
                      border: `1px solid color-mix(in oklch, var(--color-ash) ${active ? 0 : 25}%, transparent)`,
                    }}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Observações</span>
            <textarea
              className={`${inputClass} w-full`}
              style={borderStyle}
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>

          <button
            type="button"
            onClick={save}
            disabled={phase === 'saving'}
            className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-moss)' }}
          >
            {phase === 'saving' ? 'salvando…' : 'salvar na minha biblioteca'}
          </button>
        </div>
      )}
    </div>
  )
}
