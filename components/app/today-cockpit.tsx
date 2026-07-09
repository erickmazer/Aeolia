'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProgressBar } from '@/components/library/sections'
import { LogPractice } from '@/components/library/log-practice'
import { sectionProgress, type SectionStatus, type Song } from '@/lib/library/data'
import {
  computeStreak,
  practicedToday,
  daysThisWeek,
  localDay,
  type PracticeSummary,
} from '@/lib/library/practice'

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

// Cabeçalho de prática: streak + os últimos 7 dias como pontos (issue #7).
function StreakHeader({ days }: { days: string[] }) {
  const today = localDay()
  const { current } = computeStreak(days, today)
  const week = daysThisWeek(days, today)
  const set = new Set(days)
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return set.has(localDay(d))
  })

  return (
    <section className="mb-8 flex items-center justify-between">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl text-[color:var(--color-paper)] tabular-nums">
            {current > 0 ? `${current}` : '—'}
          </span>
          <span className="text-sm text-[color:var(--color-ash)]">
            {current > 0 ? (current === 1 ? 'dia de streak 🔥' : 'dias de streak 🔥') : 'comece um streak hoje'}
          </span>
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-ash)]">
          {practicedToday(days, today) ? 'praticado hoje ✓' : `${week}/7 dias esta semana`}
        </div>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {dots.map((on, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: on ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-ash) 30%, transparent)' }}
          />
        ))}
      </div>
    </section>
  )
}

export function TodayCockpit({
  initialSongs,
  summary,
}: {
  initialSongs: Song[]
  summary: PracticeSummary
}) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)
  const [days, setDays] = useState<string[]>(summary.days)

  function addDay(day: string) {
    setDays((cur) => (cur.includes(day) ? cur : [day, ...cur]))
  }

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
      <StreakHeader days={days} />

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
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-[color:var(--color-paper)]/75">
                      {nextPart ? (
                        <>
                          próxima: <span className="text-[color:var(--color-paper)]">{nextPart.name}</span>
                        </>
                      ) : (
                        <span className="text-[color:var(--color-ash)]">sem partes pendentes</span>
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <LogPractice
                        entryId={song.entryId}
                        songId={song.id}
                        variant="ghost"
                        onLogged={addDay}
                      />
                      {nextPart && (
                        <button
                          type="button"
                          onClick={() => advance(song)}
                          className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                          style={{ background: 'var(--color-moss)' }}
                        >
                          avançar
                        </button>
                      )}
                    </div>
                  </div>
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
