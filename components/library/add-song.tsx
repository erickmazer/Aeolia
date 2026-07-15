'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TECHNIQUES,
  GENRES,
  STATUSES,
  DIFFICULTY_LABELS,
  TECHNIQUE_BY_ID,
  type Song,
  type Status,
  type Difficulty,
  type TechniqueId,
} from '@/lib/library/data'
import { sectionsFromDraft, type FicheDraft } from '@/lib/library/fiche-ai'
import { SongSearch } from './song-search'
import { GeneratingFiche } from './generating-fiche'

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
  // capa vinda do autocomplete (iTunes); persiste no canônico ao salvar
  const [artwork, setArtwork] = useState<string | null>(null)
  // veio do autocomplete? então o título/artista do iTunes é o "nome bonitinho"
  // canônico (a IA pode reformatar) e a capa é persistida.
  const [fromSearch, setFromSearch] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  // fallback pra músicas que a base não acha (regionais, autorais)
  const [manual, setManual] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  // música já no catálogo (dedup hit): adiciona sem chamar IA nem editar a ficha
  const [existing, setExisting] = useState<Song | null>(null)
  const [existingStatus, setExistingStatus] = useState<Status>('quero-aprender')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setArtist('')
    setArtwork(null)
    setFromSearch(false)
    setManual(false)
    setDraft(null)
    setExisting(null)
    setExistingStatus('quero-aprender')
    setPhase('idle')
    setError(null)
    setOpen(false)
  }

  async function generate(overrideTitle?: string, overrideArtist?: string) {
    const t = (overrideTitle ?? title).trim()
    const a = (overrideArtist ?? artist).trim()
    if (!t || !a) return
    setPhase('generating')
    setError(null)
    setDraft(null)
    setExisting(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: t, artist: a }),
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
        sections: existing.sections ?? [],
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
    // Nome canônico: quando veio do autocomplete, o do iTunes é o "bonitinho"
    // (a IA pode reformatar título/artista); no manual, fica o do rascunho.
    const canonTitle = fromSearch ? title.trim() : draft.title
    const canonArtist = fromSearch ? artist.trim() : draft.artist
    const canonArtwork = fromSearch ? artwork : null
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .rpc('create_canonical_and_add', {
          _title: canonTitle,
          _artist: canonArtist,
          _difficulty: draft.difficulty,
          _techniques: draft.techniques,
          _genre: draft.genre,
          _best_version_label: draft.bestVersion?.label ?? null,
          _best_version_url: draft.bestVersion?.url ?? null,
          _best_lesson_label: draft.bestLesson?.label ?? null,
          _best_lesson_url: draft.bestLesson?.url ?? null,
          _notes: draft.notes || null,
          _sections: sectionsFromDraft(draft.sections),
          _artwork: canonArtwork,
        })
        .single()
      const entry = data as { id: string; song_id: string } | null
      if (dbError || !entry) throw new Error(dbError?.message ?? 'Falha ao salvar.')

      onAdded({
        id: entry.song_id,
        title: canonTitle,
        artist: canonArtist,
        difficulty: draft.difficulty as Difficulty,
        status: draft.status,
        techniques: draft.techniques as TechniqueId[],
        contexts: [],
        genre: draft.genre,
        prerequisites: [],
        nextSongs: [],
        bestVersion: draft.bestVersion,
        bestLesson: draft.bestLesson,
        notes: draft.notes || undefined,
        artwork: canonArtwork ?? undefined,
        entryId: entry.id,
        sections: sectionsFromDraft(draft.sections),
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

      {/* Entrada: busca (principal) → fallback manual → estado de geração.
          Durante a geração, a entrada dá lugar ao herói com capa + skeleton. */}
      {phase === 'generating' ? (
        <GeneratingFiche title={title} artist={artist} artwork={artwork} />
      ) : !manual ? (
        <div className="space-y-2">
          <SongSearch
            onPick={({ title: t, artist: a, artwork: art }) => {
              setTitle(t)
              setArtist(a)
              setArtwork(art ?? null)
              setFromSearch(true)
              generate(t, a)
            }}
          />
          <button
            type="button"
            onClick={() => setManual(true)}
            className="text-xs text-[color:var(--color-ash)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[color:var(--color-paper)]"
          >
            digitar manualmente
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input className={inputClass} style={borderStyle} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={inputClass} style={borderStyle} placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} />
          <button
            type="button"
            onClick={() => {
              setArtwork(null)
              setFromSearch(false)
              generate()
            }}
            disabled={!title.trim() || !artist.trim()}
            className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-patina)' }}
          >
            buscar / gerar
          </button>
          <button
            type="button"
            onClick={() => setManual(false)}
            className="self-center text-xs text-[color:var(--color-ash)] underline decoration-dotted underline-offset-2 hover:text-[color:var(--color-paper)]"
          >
            voltar à busca
          </button>
        </div>
      )}

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
          {existing.genre && (
            <p className="text-sm text-[color:var(--color-paper)]/80">{existing.genre}</p>
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

          <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
            Gênero
            <select
              className={inputClass}
              style={borderStyle}
              value={draft.genre}
              onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

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

          {draft.sections && draft.sections.length > 0 && (
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">
                Partes sugeridas <span className="normal-case tracking-normal">· acordes a conferir</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {draft.sections.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="text-[color:var(--color-paper)]/90">{s.name}</span>
                    {s.chords && <span className="font-mono text-xs text-[color:var(--color-patina)]">{s.chords}</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs italic text-[color:var(--color-ash)]">
                Entram como rascunho no seu progresso — dá pra ajustar os acordes depois, na ficha.
              </p>
            </div>
          )}

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
