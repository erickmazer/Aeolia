'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  STATUSES,
  TECHNIQUES,
  GENRES,
  DIFFICULTY_LABELS,
  TECHNIQUE_BY_ID,
  STATUS_BY_ID,
  countByStatus,
  songsForTechnique,
  songById,
  type Song,
  type Status,
  type TechniqueId,
  type Section,
  type Material,
} from '@/lib/library/data'
import { RELATIVE_DIFFICULTY_LABEL, type SongFit } from '@/lib/library/personalization'
import { SectionsBlock, ProgressBar } from './sections'

type ById = Record<string, Song>

// Selo de dificuldade RELATIVA ao nível do usuário (vem da personalização).
function RelFitPill({ rd }: { rd: SongFit['relativeDifficulty'] }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs tracking-wide"
      style={{
        color: 'var(--color-moss)',
        background: 'color-mix(in oklch, var(--color-moss) 12%, transparent)',
        border: '1px solid color-mix(in oklch, var(--color-moss) 40%, transparent)',
      }}
      title="Dificuldade relativa ao seu nível"
    >
      {RELATIVE_DIFFICULTY_LABEL[rd]}
    </span>
  )
}

// ── Pequenos átomos visuais ─────────────────────────────────────────────────

function DifficultyDots({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 align-middle"
      title={`${DIFFICULTY_LABELS[level as 1 | 2 | 3 | 4 | 5]} (${level}/5)`}
      aria-label={`Dificuldade ${level} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background:
              i <= level ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-ash) 35%, transparent)',
          }}
        />
      ))}
    </span>
  )
}

function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_BY_ID[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs tracking-wide"
      style={{
        color: meta.color,
        background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)',
        border: `1px solid color-mix(in oklch, ${meta.color} 40%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

interface Toggle {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
}

function Chip({ active, onClick, children, count }: Toggle) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-3 py-1 text-sm transition-colors"
      style={{
        color: active ? 'var(--color-ink)' : 'var(--color-paper)',
        background: active ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-paper) 5%, transparent)',
        border: `1px solid color-mix(in oklch, var(--color-ash) ${active ? 0 : 25}%, transparent)`,
      }}
    >
      {children}
      {count != null && <span className="ml-1.5 opacity-60 tabular-nums">{count}</span>}
    </button>
  )
}

// ── Ficha (agora em bottom sheet) ────────────────────────────────────────────

function SongLinkList({
  ids,
  empty,
  byId,
  onOpen,
}: {
  ids: string[]
  empty: string
  byId: ById
  onOpen: (song: Song) => void
}) {
  const known = ids.map((id) => byId[id]).filter(Boolean)
  if (known.length === 0) {
    return <span className="text-sm italic text-[color:var(--color-ash)]">{empty}</span>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {known.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s)}
          className="rounded-md px-2 py-1 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
          style={{ background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)' }}
        >
          {s.title}
        </button>
      ))}
    </div>
  )
}

function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
    >
      {label} ↗
    </a>
  )
}

function FicheRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <div className="pt-0.5 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">{label}</div>
      <div>{children}</div>
    </div>
  )
}

// A ficha completa de uma música, apresentada como folha sobreposta (bottom
// sheet) em vez de expandir a lista inline — padrão mobile, espelha ToolsSheet.
function SongSheet({
  song,
  byId,
  onClose,
  onOpenSong,
  onPickTechnique,
  editable,
  onDelete,
  fit,
  onSectionsChange,
  materials,
}: {
  song: Song
  byId: ById
  onClose: () => void
  onOpenSong: (song: Song) => void
  onPickTechnique: (id: TechniqueId) => void
  editable?: boolean
  onDelete?: (song: Song) => void
  fit?: SongFit
  onSectionsChange?: (song: Song, sections: Section[]) => void
  materials?: Material[]
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Ficha de ${song.title}`}>
      <button
        type="button"
        aria-label="Fechar ficha"
        onClick={onClose}
        className="absolute inset-0 motion-safe:animate-[songFade_120ms_ease-out]"
        style={{ background: 'color-mix(in oklch, var(--color-ink) 70%, transparent)' }}
      />
      <div
        className="relative z-10 max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl px-5 pb-10 pt-4 motion-safe:animate-[songUp_200ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{
          background: 'color-mix(in oklch, var(--color-ink) 94%, var(--color-paper))',
          borderTop: '1px solid color-mix(in oklch, var(--color-ash) 22%, transparent)',
          boxShadow: '0 -20px 50px -20px rgba(0,0,0,0.6)',
        }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'color-mix(in oklch, var(--color-ash) 40%, transparent)' }} />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl leading-tight text-[color:var(--color-paper)]">{song.title}</h2>
            <p className="mt-0.5 text-sm italic text-[color:var(--color-ash)]">{song.artist}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusPill status={song.status} />
              <DifficultyDots level={song.difficulty} />
              {fit && <RelFitPill rd={fit.relativeDifficulty} />}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <SectionsBlock song={song} editable={editable} onChange={(secs) => onSectionsChange?.(song, secs)} />

          <FicheRow label="Técnicas">
            <div className="flex flex-wrap gap-2">
              {song.techniques.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onPickTechnique(t)
                    onClose()
                  }}
                  className="rounded-full px-2.5 py-0.5 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
                  style={{ background: 'color-mix(in oklch, var(--color-moss) 18%, transparent)' }}
                  title={TECHNIQUE_BY_ID[t]?.blurb}
                >
                  {TECHNIQUE_BY_ID[t]?.name ?? t}
                </button>
              ))}
            </div>
          </FicheRow>

          {song.genre && (
            <FicheRow label="Gênero">
              <span className="text-sm text-[color:var(--color-paper)]/80">{song.genre}</span>
            </FicheRow>
          )}
          {song.collections && song.collections.length > 0 && (
            <FicheRow label="Coleções">
              <div className="flex flex-wrap gap-2">
                {song.collections.map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2.5 py-0.5 text-sm text-[color:var(--color-paper)]/85"
                    style={{ background: 'color-mix(in oklch, var(--color-paper) 6%, transparent)' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </FicheRow>
          )}

          <FicheRow label="Pré-requisitos">
            <SongLinkList ids={song.prerequisites} empty="Nenhum — pode começar por aqui." byId={byId} onOpen={onOpenSong} />
          </FicheRow>

          <FicheRow label="Próximas">
            <SongLinkList ids={song.nextSongs} empty="Fim de uma trilha (por enquanto)." byId={byId} onOpen={onOpenSong} />
          </FicheRow>

          {(song.bestVersion || song.bestLesson) && (
            <FicheRow label="Referências">
              <div className="flex flex-col gap-1.5">
                {song.bestVersion && (
                  <div>
                    <span className="mr-2 text-xs uppercase tracking-wide text-[color:var(--color-ash)]">ouvir</span>
                    <ExternalLink {...song.bestVersion} />
                  </div>
                )}
                {song.bestLesson && (
                  <div>
                    <span className="mr-2 text-xs uppercase tracking-wide text-[color:var(--color-ash)]">estudar</span>
                    <ExternalLink {...song.bestLesson} />
                  </div>
                )}
              </div>
            </FicheRow>
          )}

          {song.notes && (
            <FicheRow label="Observações">
              <p className="max-w-prose text-sm italic leading-relaxed text-[color:var(--color-paper)]/85">{song.notes}</p>
            </FicheRow>
          )}

          {materials && materials.length > 0 && (
            <FicheRow label="Materiais">
              <ul className="flex flex-col gap-1.5">
                {materials.map((m) => (
                  <li key={m.id}>
                    {m.openUrl ? (
                      <a
                        href={m.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
                      >
                        {m.kind === 'link' ? '🔗' : '📎'} {m.title}
                      </a>
                    ) : (
                      <span className="text-sm text-[color:var(--color-paper)]/85">{m.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </FicheRow>
          )}

          {editable && onDelete && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(song)
                  onClose()
                }}
                className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] transition-colors hover:text-[color:oklch(0.6_0.15_25)]"
              >
                remover da biblioteca
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes songFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes songUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}

// Linha compacta da lista — toca pra abrir a ficha em folha (não expande inline).
function SongRow({ song, fit, onOpen }: { song: Song; fit?: SongFit; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition-colors hover:border-[color:var(--color-patina)] sm:px-5"
        style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 20%, transparent)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-lg text-[color:var(--color-paper)]">{song.title}</span>
            <span className="text-sm italic text-[color:var(--color-ash)]">{song.artist}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusPill status={song.status} />
            <DifficultyDots level={song.difficulty} />
            {fit && <RelFitPill rd={fit.relativeDifficulty} />}
          </div>
          {song.sections && song.sections.length > 0 && (
            <div className="mt-2">
              <ProgressBar sections={song.sections} />
            </div>
          )}
        </div>
        <span className="shrink-0 text-[color:var(--color-ash)]" aria-hidden>
          →
        </span>
      </button>
    </li>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function Library({
  songs,
  editable,
  onDelete,
  fit,
  onSectionsChange,
  materials,
}: {
  songs: Song[]
  editable?: boolean
  onDelete?: (song: Song) => void
  fit?: Record<string, SongFit>
  onSectionsChange?: (song: Song, sections: Section[]) => void
  materials?: Record<string, Material[]>
}) {
  const [statusFilter, setStatusFilter] = useState<Status | null>(null)
  const [techniqueFilter, setTechniqueFilter] = useState<TechniqueId | null>(null)
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const byId = useMemo(() => songById(songs), [songs])
  const selected = selectedId ? (byId[selectedId] ?? null) : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return songs
      .filter((s) => {
        if (statusFilter && s.status !== statusFilter) return false
        if (techniqueFilter && !s.techniques.includes(techniqueFilter)) return false
        if (genreFilter && s.genre !== genreFilter) return false
        if (q && !`${s.title} ${s.artist}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title))
  }, [songs, statusFilter, techniqueFilter, genreFilter, query])

  const anyFilter = statusFilter || techniqueFilter || genreFilter || query
  const total = songs.length

  function pickTechnique(id: TechniqueId) {
    setTechniqueFilter((cur) => (cur === id ? null : id))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-16">
      {/* Panorama */}
      <section aria-label="Panorama">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-lg sm:grid-cols-4"
          style={{ background: 'color-mix(in oklch, var(--color-ash) 20%, transparent)' }}
        >
          {[
            { label: 'No repertório', value: total },
            ...STATUSES.map((s) => ({ label: s.label, value: countByStatus(songs, s.id), color: s.color })),
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-5" style={{ background: 'var(--color-ink)' }}>
              <div
                className="font-serif text-3xl tabular-nums"
                style={{ color: 'color' in stat ? (stat.color as string) : 'var(--color-paper)' }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Técnicas */}
      <section aria-labelledby="tecnicas-title">
        <h2 id="tecnicas-title" className="mb-2 font-serif text-2xl">As técnicas evoluem junto</h2>
        <p className="mb-6 max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
          Cada música desenvolve uma ou mais destas habilidades. Toque numa técnica para ver quais músicas a treinam.
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TECHNIQUES.map((t) => {
            const n = songsForTechnique(songs, t.id).length
            const active = techniqueFilter === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => pickTechnique(t.id)}
                  aria-pressed={active}
                  className="w-full rounded-lg border px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: active ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-ash) 20%, transparent)',
                    background: active ? 'color-mix(in oklch, var(--color-patina) 12%, transparent)' : 'transparent',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[color:var(--color-paper)]">{t.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-[color:var(--color-ash)]">
                      {n} {n === 1 ? 'música' : 'músicas'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-paper)]/70">{t.blurb}</p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Repertório + filtros */}
      <section aria-labelledby="repertorio-title">
        <h2 id="repertorio-title" className="mb-2 font-serif text-2xl">O repertório</h2>
        <p className="mb-6 max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
          Organizado por propósito, não só por gênero. Toque numa música para abrir a ficha — e siga os
          pré-requisitos e as próximas para percorrer a árvore de evolução.
        </p>

        <div className="mb-5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por música ou artista…"
            className="w-full max-w-sm rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]"
            style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
          />
        </div>

        <div className="mb-3">
          <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Status</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Chip
                key={s.id}
                active={statusFilter === s.id}
                onClick={() => setStatusFilter((cur) => (cur === s.id ? null : s.id))}
                count={countByStatus(songs, s.id)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Gênero</div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip key={g} active={genreFilter === g} onClick={() => setGenreFilter((cur) => (cur === g ? null : g))}>
                {g}
              </Chip>
            ))}
          </div>
        </div>

        {techniqueFilter && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-ash)]">
            <span>Técnica:</span>
            <Chip active onClick={() => setTechniqueFilter(null)}>
              {TECHNIQUE_BY_ID[techniqueFilter].name}
            </Chip>
          </div>
        )}

        <div
          className="mb-4 mt-5 flex items-center justify-between border-t pt-4 text-sm text-[color:var(--color-ash)]"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}
        >
          <span>
            {filtered.length} de {total} {filtered.length === 1 ? 'música' : 'músicas'}
          </span>
          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter(null)
                setTechniqueFilter(null)
                setGenreFilter(null)
                setQuery('')
              }}
              className="text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
            >
              limpar filtros
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-[color:var(--color-ash)]">
            {total === 0
              ? 'Sua biblioteca está vazia. Adicione a primeira música por IA acima.'
              : 'Nada com esses filtros ainda. A biblioteca é viva — talvez seja a próxima a entrar.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((song) => (
              <SongRow key={song.id} song={song} fit={fit?.[song.id]} onOpen={() => setSelectedId(song.id)} />
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <SongSheet
          song={selected}
          byId={byId}
          onClose={() => setSelectedId(null)}
          onOpenSong={(s) => setSelectedId(s.id)}
          onPickTechnique={pickTechnique}
          editable={editable}
          onDelete={onDelete}
          fit={fit?.[selected.id]}
          onSectionsChange={onSectionsChange}
          materials={selected.entryId ? materials?.[selected.entryId] : undefined}
        />
      )}
    </div>
  )
}
