'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TECHNIQUE_BY_ID, type Song, type Section, type Material } from '@/lib/library/data'
import { artworkHiRes } from '@/lib/library/artwork'
import { Cover } from './cover'
import { StatusPill, DifficultyDots } from './library'
import { SectionsBlock } from './sections'

const rowLabel = 'text-xs uppercase tracking-widest text-[color:var(--color-ash)]'

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <div className={`pt-0.5 ${rowLabel}`}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

/**
 * Página da música (rota `/biblioteca/[songId]`) — substitui o bottom sheet na
 * biblioteca pessoal por uma página de verdade: herói com a capa (e um fundo
 * desfocado da própria arte), partes editáveis, referências e materiais.
 */
export function SongDetail({
  song,
  related,
  materials,
}: {
  song: Song
  /** id → título das músicas do usuário (pra nomear pré-requisitos/próximas). */
  related: Record<string, string>
  materials: Material[]
}) {
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>(song.sections ?? [])
  const [busy, setBusy] = useState(false)

  async function handleSectionsChange(next: Section[]) {
    setSections(next)
    if (!song.entryId) return
    const supabase = createClient()
    await supabase.from('library_entries').update({ sections: next }).eq('id', song.entryId)
  }

  async function handleDelete() {
    if (!song.entryId) return
    if (!window.confirm(`Remover "${song.title}" da sua biblioteca?`)) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('library_entries').delete().eq('id', song.entryId)
    if (error) {
      setBusy(false)
      return
    }
    router.push('/biblioteca')
    router.refresh()
  }

  const linkableIds = (ids: string[]) => ids.filter((id) => related[id])

  return (
    <div className="space-y-8">
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
      >
        <span aria-hidden>←</span> Biblioteca
      </Link>

      {/* Herói: fundo desfocado da capa + capa nítida e título por cima */}
      <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 18%, transparent)' }}>
        {song.artwork && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artworkHiRes(song.artwork, 600)}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-40 blur-2xl"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, color-mix(in oklch, var(--color-ink) 55%, transparent), var(--color-ink))' }} />
          </div>
        )}
        <div className="relative flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-end sm:gap-5">
          <Cover artwork={song.artwork} size={112} rounded="rounded-xl" className="shadow-lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-tight text-[color:var(--color-paper)]">{song.title}</h1>
            <p className="mt-0.5 text-sm italic text-[color:var(--color-ash)]">{song.artist}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusPill status={song.status} />
              <DifficultyDots level={song.difficulty} />
            </div>
          </div>
        </div>
      </div>

      {/* Partes (editável) */}
      <SectionsBlock song={{ ...song, sections }} editable onChange={handleSectionsChange} />

      <div className="space-y-5">
        {song.techniques.length > 0 && (
          <Field label="Técnicas">
            <div className="flex flex-wrap gap-2">
              {song.techniques.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-sm text-[color:var(--color-paper)]/90"
                  style={{ background: 'color-mix(in oklch, var(--color-moss) 18%, transparent)' }}
                  title={TECHNIQUE_BY_ID[t]?.blurb}
                >
                  {TECHNIQUE_BY_ID[t]?.name ?? t}
                </span>
              ))}
            </div>
          </Field>
        )}

        {song.genre && (
          <Field label="Gênero">
            <span className="text-sm text-[color:var(--color-paper)]/80">{song.genre}</span>
          </Field>
        )}

        <Field label="Pré-requisitos">
          {linkableIds(song.prerequisites).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {linkableIds(song.prerequisites).map((id) => (
                <Link
                  key={id}
                  href={`/biblioteca/${id}`}
                  className="rounded-md px-2 py-1 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
                  style={{ background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)' }}
                >
                  {related[id]}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-sm italic text-[color:var(--color-ash)]">Nenhum — pode começar por aqui.</span>
          )}
        </Field>

        <Field label="Próximas">
          {linkableIds(song.nextSongs).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {linkableIds(song.nextSongs).map((id) => (
                <Link
                  key={id}
                  href={`/biblioteca/${id}`}
                  className="rounded-md px-2 py-1 text-sm text-[color:var(--color-paper)]/90 transition-colors hover:text-[color:var(--color-patina)]"
                  style={{ background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)' }}
                >
                  {related[id]}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-sm italic text-[color:var(--color-ash)]">Fim de uma trilha (por enquanto).</span>
          )}
        </Field>

        {(song.bestVersion || song.bestLesson) && (
          <Field label="Referências">
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
          </Field>
        )}

        {song.notes && (
          <Field label="Observações">
            <p className="max-w-prose text-sm italic leading-relaxed text-[color:var(--color-paper)]/85">{song.notes}</p>
          </Field>
        )}

        {materials.length > 0 && (
          <Field label="Materiais">
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
          </Field>
        )}
      </div>

      <div className="border-t pt-5" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 15%, transparent)' }}>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] transition-colors hover:text-[color:oklch(0.6_0.15_25)] disabled:opacity-40"
        >
          {busy ? 'removendo…' : 'remover da biblioteca'}
        </button>
      </div>
    </div>
  )
}
