'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TECHNIQUES,
  CONTEXTS,
  STATUSES,
  DIFFICULTY_LABELS,
  TECHNIQUE_BY_ID,
  CONTEXT_BY_ID,
  type Song,
  type Status,
  type Difficulty,
  type TechniqueId,
  type ContextId,
} from '@/lib/library/data'
import type { FicheDraft } from '@/lib/library/fiche-ai'

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

export function AddSong({ onAdded }: { onAdded: (song: Song) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [draft, setDraft] = useState<Draft | null>(null)
  // música já no catálogo (dedup hit): adiciona sem chamar IA nem editar a ficha
  const [existing, setExisting] = useState<Song | null>(null)
  const [existingStatus, setExistingStatus] = useState<Status>('quero-aprender')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setArtist('')
    setDraft(null)
    setExisting(null)
    setExistingStatus('quero-aprender')
    setPhase('idle')
    setError(null)
    setOpen(false)
  }

  async function generate() {
    if (!title.trim() || !artist.trim()) return
    setPhase('generating')
    setError(null)
    setDraft(null)
    setExisting(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? `Erro ${res.status}`)

      if (payload.existing && payload.song) {
        setExisting(payload.song as Song)
      } else {
        setDraft({ ...(payload.draft as FicheDraft), status: 'quero-aprender' })
      }
      setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao gerar a ficha.')
      setPhase('idle')
    }
  }

  // Adiciona uma música já existente no catálogo (sem IA).
  async function addExisting() {
    if (!existing) return
    setPhase('saving')
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .rpc('add_existing_to_library', { _song_id: existing.id })
        .single()
      const entry = data as { id: string } | null
      if (dbError || !entry) throw new Error(dbError?.message ?? 'Falha ao adicionar.')

      onAdded({
        ...existing,
        status: existingStatus,
        prerequisites: [],
        nextSongs: [],
        entryId: entry.id,
      })
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao adicionar.')
      setPhase('review')
    }
  }

  // Cria a música canônica (nova) a partir do rascunho revisado e adiciona.
  async function saveDraft() {
    if (!draft) return
    setPhase('saving')
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .rpc('create_canonical_and_add', {
          _title: draft.title,
          _artist: draft.artist,
          _difficulty: draft.difficulty,
          _techniques: draft.techniques,
          _contexts: draft.contexts,
          _best_version_label: draft.bestVersion?.label ?? null,
          _best_version_url: draft.bestVersion?.url ?? null,
          _best_lesson_label: draft.bestLesson?.label ?? null,
          _best_lesson_url: draft.bestLesson?.url ?? null,
          _notes: draft.notes || null,
        })
        .single()
      const entry = data as { id: string; song_id: string } | null
      if (dbError || !entry) throw new Error(dbError?.message ?? 'Falha ao salvar.')

      onAdded({
        id: entry.song_id,
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
        entryId: entry.id,
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
          {phase === 'generating' ? 'buscando…' : 'buscar / gerar'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[color:oklch(0.65_0.15_25)]">{error}</p>}

      {/* Já no catálogo (dedup hit) — só escolher status e adicionar */}
      {existing && phase !== 'generating' && (
        <div className="mt-6 space-y-4 border-t pt-5" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}>
          <p className="text-xs italic text-[color:var(--color-ash)]">
            Essa música já está no catálogo — a ficha é compartilhada. É só adicionar à sua biblioteca.
          </p>
          <div>
            <div className="font-serif text-lg text-[color:var(--color-paper)]">{existing.title}</div>
            <div className="text-sm italic text-[color:var(--color-ash)]">{existing.artist}</div>
          </div>
          {existing.techniques.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existing.techniques.map((t) => (
                <span key={t} className="rounded-full px-2.5 py-0.5 text-sm text-[color:var(--color-paper)]/90" style={{ background: 'color-mix(in oklch, var(--color-moss) 18%, transparent)' }}>
                  {TECHNIQUE_BY_ID[t]?.name ?? t}
                </span>
              ))}
            </div>
          )}
          {existing.contexts.length > 0 && (
            <p className="text-sm text-[color:var(--color-paper)]/80">
              {existing.contexts.map((c) => CONTEXT_BY_ID[c]?.name ?? c).join(' · ')}
            </p>
          )}
          {existing.notes && (
            <p className="max-w-prose text-sm italic leading-relaxed text-[color:var(--color-paper)]/85">{existing.notes}</p>
          )}
          <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
            Status
            <select
              className={inputClass}
              style={borderStyle}
              value={existingStatus}
              onChange={(e) => setExistingStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={addExisting}
            disabled={phase === 'saving'}
            className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-moss)' }}
          >
            {phase === 'saving' ? 'adicionando…' : 'adicionar à minha biblioteca'}
          </button>
        </div>
      )}

      {/* Rascunho novo (dedup miss) — revisar antes de salvar */}
      {draft && phase !== 'generating' && (
        <div className="mt-6 space-y-5 border-t pt-5" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}>
          <p className="text-xs italic text-[color:var(--color-ash)]">
            Música nova — rascunho gerado por IA. Revise antes de salvar (a IA pode errar dificuldade ou nota). Ela entra no catálogo compartilhado.
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
            onClick={saveDraft}
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
