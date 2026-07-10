'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sectionProgress, type Section, type SectionStatus, type Song } from '@/lib/library/data'
import { practicedToday, type PracticeSummary } from '@/lib/library/practice'
import { ChordRow } from './chord-diagram'
import { LogPractice } from './log-practice'

// Product surface em inglês (produto pensado global).
const EN_STATUS: Record<SectionStatus, string> = {
  'a-fazer': 'To do',
  praticando: 'Practicing',
  dominada: 'Done',
}
const STATUS_COLOR: Record<SectionStatus, string> = {
  'a-fazer': 'var(--color-ash)',
  praticando: 'var(--color-patina)',
  dominada: 'var(--color-moss)',
}
const NEXT_STATUS: Record<SectionStatus, SectionStatus> = {
  'a-fazer': 'praticando',
  praticando: 'dominada',
  dominada: 'a-fazer',
}
const STATUS_RANK: Record<Song['status'], number> = { aprendendo: 0, 'quero-aprender': 1, dominada: 2 }

function isDone(song: Song): boolean {
  if (song.sections && song.sections.length > 0) return song.sections.every((s) => s.status === 'dominada')
  return song.status === 'dominada'
}

export function PracticeMode({
  initialSongs,
  summary,
}: {
  initialSongs: Song[]
  summary?: PracticeSummary
}) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)
  const [index, setIndex] = useState(0)
  const [days, setDays] = useState<string[]>(summary?.days ?? [])
  const loggedToday = practicedToday(days)

  function addDay(day: string) {
    setDays((cur) => (cur.includes(day) ? cur : [day, ...cur]))
  }

  // Fila: o que ainda não está dominado, aprendendo primeiro, por dificuldade.
  const queue = useMemo(
    () =>
      songs
        .filter((s) => !isDone(s))
        .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.difficulty - b.difficulty),
    [songs],
  )

  if (queue.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-lg text-[color:var(--color-paper)]/85">Nothing to practice right now.</p>
        <p className="mt-2 text-sm text-[color:var(--color-ash)]">
          {songs.length === 0
            ? 'Adicione músicas no Studio para começar.'
            : 'Tudo dominado por aqui 🎉 — hora de uma música nova.'}
        </p>
      </div>
    )
  }

  const safeIndex = Math.min(index, queue.length - 1)
  const song = queue[safeIndex]
  const sections = song.sections ?? []
  const pct = Math.round(sectionProgress(sections) * 100)

  async function persist(entryId: string, next: Section[]) {
    const supabase = createClient()
    await supabase.from('library_entries').update({ sections: next }).eq('id', entryId)
  }

  function cycle(sectionId: string) {
    if (!song.entryId) return
    const next = sections.map((s) => (s.id === sectionId ? { ...s, status: NEXT_STATUS[s.status] } : s))
    setSongs((cur) => cur.map((s) => (s.entryId === song.entryId ? { ...s, sections: next } : s)))
    void persist(song.entryId, next)
  }

  function go(delta: number) {
    setIndex((i) => {
      const n = Math.min(i, queue.length - 1) + delta
      return (n + queue.length) % queue.length
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm text-[color:var(--color-ash)]">
        <span className="tabular-nums">
          {safeIndex + 1} / {queue.length} na fila
        </span>
        {sections.length > 0 && <span className="tabular-nums">{pct}% dominado</span>}
      </div>

      {/* Música atual — grande, pensado pra tocar olhando */}
      <div className="mb-8">
        <h2 className="font-serif text-4xl leading-tight text-[color:var(--color-paper)]">{song.title}</h2>
        <p className="mt-1 text-lg italic text-[color:var(--color-ash)]">{song.artist}</p>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-lg border p-5 text-sm leading-relaxed text-[color:var(--color-paper)]/80"
           style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}>
          Essa música ainda não tem partes. Adicione partes (intro, refrão, solo…) no{' '}
          <span className="text-[color:var(--color-patina)]">Studio</span> para praticar por seção.
        </p>
      ) : (
        <ul className="space-y-3">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => cycle(s.id)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors"
                style={{
                  borderColor:
                    s.status === 'dominada'
                      ? 'color-mix(in oklch, var(--color-moss) 55%, transparent)'
                      : 'color-mix(in oklch, var(--color-ash) 25%, transparent)',
                  background:
                    s.status === 'dominada' ? 'color-mix(in oklch, var(--color-moss) 12%, transparent)' : 'transparent',
                }}
              >
                <span className="text-lg text-[color:var(--color-paper)]">{s.name}</span>
                <span className="inline-flex items-center gap-2 text-sm" style={{ color: STATUS_COLOR[s.status] }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                  {EN_STATUS[s.status]}
                </span>
              </button>
              {s.chords && (
                <div className="mt-2 px-1">
                  <ChordRow chords={s.chords} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {sections.length > 0 && (
        <p className="mt-4 text-center text-xs text-[color:var(--color-ash)]">toque numa parte para avançar o estado</p>
      )}

      {/* Registrar prática desta música (issue #7) */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <LogPractice key={song.entryId ?? song.id} entryId={song.entryId} songId={song.id} onLogged={addDay} />
        <span className="text-xs text-[color:var(--color-ash)]">
          {loggedToday ? 'você já praticou hoje — bom trabalho ✓' : 'toque ao terminar de praticar'}
        </span>
      </div>

      {/* Navegação da fila */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-md border px-4 py-2 text-sm text-[color:var(--color-paper)] transition-colors hover:border-[color:var(--color-patina)]"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-md px-5 py-2 text-sm text-[color:var(--color-ink)]"
          style={{ background: 'var(--color-patina)' }}
        >
          Next song →
        </button>
      </div>
    </div>
  )
}
