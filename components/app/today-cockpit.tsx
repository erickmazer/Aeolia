'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProgressBar } from '@/components/library/sections'
import { sectionProgress, type SectionStatus, type Song } from '@/lib/library/data'

const NEXT_STATUS: Record<SectionStatus, SectionStatus> = {
  'a-fazer': 'praticando',
  praticando: 'dominada',
  dominada: 'a-fazer',
}

function isDone(s: Song): boolean {
  if (s.sections && s.sections.length > 0) return s.sections.every((x) => x.status === 'dominada')
  return s.status === 'dominada'
}
function isActive(s: Song): boolean {
  if (isDone(s)) return false
  if (s.status === 'aprendendo') return true
  return (s.sections ?? []).some((x) => x.status !== 'a-fazer')
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">{title}</h2>
      {children}
    </section>
  )
}

export function TodayCockpit({ initialSongs }: { initialSongs: Song[] }) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)

  const active = songs.filter(isActive).sort((a, b) => sectionProgress(b.sections) - sectionProgress(a.sections))
  const ready = songs.filter((s) => !isDone(s) && !isActive(s))

  async function advance(song: Song) {
    if (!song.entryId) return
    const secs = song.sections ?? []
    const idx = secs.findIndex((x) => x.status !== 'dominada')
    if (idx < 0) return
    const next = secs.map((x, i) => (i === idx ? { ...x, status: NEXT_STATUS[x.status] } : x))
    setSongs((cur) => cur.map((s) => (s.entryId === song.entryId ? { ...s, sections: next } : s)))
    const supabase = createClient()
    await supabase.from('library_entries').update({ sections: next }).eq('id', song.entryId)
  }

  if (songs.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-lg text-[color:var(--color-paper)]/85">Sua jornada começa aqui.</p>
        <Link
          href="/songs"
          className="mt-3 inline-block rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)]"
          style={{ background: 'var(--color-patina)' }}
        >
          Adicionar primeira música →
        </Link>
      </div>
    )
  }

  return (
    <div className="pt-2">
      {active.length > 0 && (
        <Group title="Continuando a jornada">
          <ul className="space-y-3">
            {active.map((song) => {
              const nextPart = (song.sections ?? []).find((x) => x.status !== 'dominada')
              return (
                <li
                  key={song.entryId ?? song.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-serif text-lg text-[color:var(--color-paper)]">{song.title}</div>
                      <div className="truncate text-sm italic text-[color:var(--color-ash)]">{song.artist}</div>
                    </div>
                    <ProgressBar sections={song.sections} />
                  </div>
                  {nextPart && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-[color:var(--color-paper)]/75">
                        próxima: <span className="text-[color:var(--color-paper)]">{nextPart.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => advance(song)}
                        className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                        style={{ background: 'var(--color-moss)' }}
                      >
                        avançar
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <Link
            href="/practice"
            className="mt-4 inline-block text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
          >
            Entrar no modo prática →
          </Link>
        </Group>
      )}

      {ready.length > 0 && (
        <Group title="Prontas pra começar">
          <ul className="flex flex-wrap gap-2">
            {ready.map((song) => (
              <li
                key={song.entryId ?? song.id}
                className="rounded-full px-3 py-1.5 text-sm text-[color:var(--color-paper)]/90"
                style={{ background: 'color-mix(in oklch, var(--color-paper) 5%, transparent)' }}
              >
                {song.title} <span className="text-[color:var(--color-ash)]">· {song.artist}</span>
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Descobrir">
        <Link
          href="/songs"
          className="block rounded-xl border p-4 text-sm text-[color:var(--color-paper)]/85 transition-colors hover:border-[color:var(--color-patina)]"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
        >
          Peça sugestões da IA no nível certo em <span className="text-[color:var(--color-patina)]">Songs → Descobrir</span> →
        </Link>
      </Group>
    </div>
  )
}
