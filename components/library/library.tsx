'use client'

import { useMemo, useState } from 'react'
import {
  STATUSES,
  TECHNIQUES,
  CONTEXTS,
  DIFFICULTY_LABELS,
  TECHNIQUE_BY_ID,
  CONTEXT_BY_ID,
  STATUS_BY_ID,
  countByStatus,
  songsForTechnique,
  songById,
  type Song,
  type Status,
  type TechniqueId,
  type ContextId,
  type Section,
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

// ── Ficha da música ─────────────────────────────────────────────────────────

function SongLinkList({ ids, empty, byId }: { ids: string[]; empty: string; byId: ById }) {
  const known = ids.map((id) => byId[id]).filter(Boolean)
  if (known.length === 0) {
    return <span className="text-sm italic text-[color:var(--color-ash)]">{empty}</span>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {known.map((s) => (
        <a
          key={s.id}
          href={`#song-${s.id}`}
          className="rounded-md px-2 py-1 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
          style={{ background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)' }}
        >
          {s.title}
        </a>
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
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <div className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] pt-0.5">{label}</div>
      <div>{children}</div>
    </div>
  )
}

function SongCard({
  song,
  byId,
  expanded,
  onToggle,
  onPickTechnique,
  editable,
  onDelete,
  fit,
  onSectionsChange,
}: {
  song: Song
  byId: ById
  expanded: boolean
  onToggle: () => void
  onPickTechnique: (id: TechniqueId) => void
  editable?: boolean
  onDelete?: (song: Song) => void
  fit?: SongFit
  onSectionsChange?: (song: Song, sections: Section[]) => void
}) {
  return (
    <li
      id={`song-${song.id}`}
      className="scroll-mt-8 rounded-lg border transition-colors"
      style={{
        borderColor: 'color-mix(in oklch, var(--color-ash) 20%, transparent)',
        background: expanded ? 'color-mix(in oklch, var(--color-paper) 3%, transparent)' : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
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
            <div className="mt-2"><ProgressBar sections={song.sections} /></div>
          )}
        </div>
        <span
          className="shrink-0 text-[color:var(--color-ash)] transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
          aria-hidden
        >
          →
        </span>
      </button>

      {expanded && (
        <div
          className="space-y-5 border-t px-4 py-5 sm:px-5"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}
        >
          <SectionsBlock song={song} editable={editable} onChange={(secs) => onSectionsChange?.(song, secs)} />
          <FicheRow label="Técnicas">
            <div className="flex flex-wrap gap-2">
              {song.techniques.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onPickTechnique(t)}
                  className="rounded-full px-2.5 py-0.5 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
                  style={{ background: 'color-mix(in oklch, var(--color-moss) 18%, transparent)' }}
                  title={TECHNIQUE_BY_ID[t]?.blurb}
                >
                  {TECHNIQUE_BY_ID[t]?.name ?? t}
                </button>
              ))}
            </div>
          </FicheRow>

          <FicheRow label="Contextos">
            <div className="flex flex-wrap gap-2">
              {song.contexts.map((c, i) => (
                <span key={c} className="text-sm text-[color:var(--color-paper)]/80" title={CONTEXT_BY_ID[c]?.blurb}>
                  {CONTEXT_BY_ID[c]?.name ?? c}
                  {i !== song.contexts.length - 1 && <span className="ml-2 text-[color:var(--color-ash)]">·</span>}
                </span>
              ))}
            </div>
          </FicheRow>

          <FicheRow label="Pré-requisitos">
            <SongLinkList ids={song.prerequisites} empty="Nenhum — pode começar por aqui." byId={byId} />
          </FicheRow>

          <FicheRow label="Próximas">
            <SongLinkList ids={song.nextSongs} empty="Fim de uma trilha (por enquanto)." byId={byId} />
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
              <p className="max-w-prose text-sm italic leading-relaxed text-[color:var(--color-paper)]/85">
                {song.notes}
              </p>
            </FicheRow>
          )}

          {editable && onDelete && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onDelete(song)}
                className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] transition-colors hover:text-[color:oklch(0.6_0.15_25)]"
              >
                remover da biblioteca
              </button>
            </div>
          )}
        </div>
      )}
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
}: {
  songs: Song[]
  editable?: boolean
  onDelete?: (song: Song) => void
  fit?: Record<string, SongFit>
  onSectionsChange?: (song: Song, sections: Section[]) => void
}) {
  const [statusFilter, setStatusFilter] = useState<Status | null>(null)
  const [techniqueFilter, setTechniqueFilter] = useState<TechniqueId | null>(null)
  const [contextFilter, setContextFilter] = useState<ContextId | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const byId = useMemo(() => songById(songs), [songs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return songs
      .filter((s) => {
        if (statusFilter && s.status !== statusFilter) return false
        if (techniqueFilter && !s.techniques.includes(techniqueFilter)) return false
        if (contextFilter && !s.contexts.includes(contextFilter)) return false
        if (q && !`${s.title} ${s.artist}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title))
  }, [songs, statusFilter, techniqueFilter, contextFilter, query])

  const anyFilter = statusFilter || techniqueFilter || contextFilter || query
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
          <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Contexto</div>
          <div className="flex flex-wrap gap-2">
            {CONTEXTS.map((c) => (
              <Chip
                key={c.id}
                active={contextFilter === c.id}
                onClick={() => setContextFilter((cur) => (cur === c.id ? null : c.id))}
              >
                {c.name}
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
                setContextFilter(null)
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
              <SongCard
                key={song.id}
                song={song}
                byId={byId}
                expanded={expanded === song.id}
                onToggle={() => setExpanded((cur) => (cur === song.id ? null : song.id))}
                onPickTechnique={pickTechnique}
                editable={editable}
                onDelete={onDelete}
                fit={fit?.[song.id]}
                onSectionsChange={onSectionsChange}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
