'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SECTION_STATUS_LABEL, sectionProgress, type Section, type Song } from '@/lib/library/data'
import {
  SECTION_STATUS_COLOR,
  NEXT_SECTION_STATUS,
  advanceFirstPending,
  firstPending,
  isDone,
} from '@/lib/library/section-progress'
import {
  computeStreak,
  daysThisWeek,
  localDay,
  practicedToday,
  type PracticeSummary,
} from '@/lib/library/practice'
import { ChordRow } from '@/components/library/chord-diagram'
import { LogPractice } from '@/components/library/log-practice'

export interface ExerciseSuggestion {
  name: string
  desc: string
  skill: string
}

const STATUS_RANK: Record<Song['status'], number> = { aprendendo: 0, 'quero-aprender': 1, dominada: 2 }

// Faixa compacta de streak — herda o cálculo isomórfico de lib/library/practice.
function StreakStrip({ days }: { days: string[] }) {
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
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-2xl tabular-nums text-[color:var(--color-paper)]">
          {current > 0 ? current : '—'}
        </span>
        <span className="text-xs text-[color:var(--color-ash)]">
          {current > 0 ? '🔥 streak' : 'comece hoje'} · {practicedToday(days, today) ? 'praticado ✓' : `${week}/7 na semana`}
        </span>
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
    </div>
  )
}

// Praticar unificado: funde o antigo Today + Practice num fluxo de sessão, um
// item por vez (seção de música ou exercício). Cada item concluído registra
// prática (streak) e avança o progresso; concluir uma música celebra na trilha.
export function PracticeSession({
  initialSongs,
  summary,
  exercise,
}: {
  initialSongs: Song[]
  summary: PracticeSummary
  exercise?: ExerciseSuggestion | null
}) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)
  const [days, setDays] = useState<string[]>(summary.days)
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  function addDay(day: string) {
    setDays((cur) => (cur.includes(day) ? cur : [day, ...cur]))
  }
  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800)
  }

  // Fila da sessão: músicas não dominadas (aprendendo primeiro, por dificuldade).
  const queue = useMemo(
    () =>
      songs
        .filter((s) => !isDone(s))
        .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.difficulty - b.difficulty),
    [songs],
  )

  const total = queue.length + (exercise ? 1 : 0)

  if (songs.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-lg text-[color:var(--color-paper)]/85">Sua jornada começa aqui.</p>
        <Link
          href="/biblioteca"
          className="mt-3 inline-block rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)]"
          style={{ background: 'var(--color-patina)' }}
        >
          Adicionar primeira música →
        </Link>
      </div>
    )
  }

  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const onExercise = safeIndex >= queue.length && !!exercise
  const song = onExercise ? null : queue[Math.min(safeIndex, queue.length - 1)]

  function go(delta: number) {
    setIndex((i) => {
      const n = Math.min(i, total - 1) + delta
      return (n + total) % total
    })
  }

  async function persist(entryId: string, next: Section[]) {
    const supabase = createClient()
    await supabase.from('library_entries').update({ sections: next }).eq('id', entryId)
  }

  // Toca numa parte → cicla o estado.
  function cycle(target: Song, sectionId: string) {
    if (!target.entryId) return
    const next = (target.sections ?? []).map((s) =>
      s.id === sectionId ? { ...s, status: NEXT_SECTION_STATUS[s.status] } : s,
    )
    setSongs((cur) => cur.map((s) => (s.entryId === target.entryId ? { ...s, sections: next } : s)))
    void persist(target.entryId, next)
  }

  // Ação primária: avança a primeira parte pendente; celebra se dominar a música.
  function advance(target: Song) {
    if (!target.entryId) return
    const secs = target.sections ?? []
    const next = advanceFirstPending(secs)
    if (next === secs) return
    const updated: Song = { ...target, sections: next }
    setSongs((cur) => cur.map((s) => (s.entryId === target.entryId ? updated : s)))
    void persist(target.entryId, next)
    flash(isDone(updated) ? '🎸 música dominada — +1 na trilha' : '✓ parte avançada')
  }

  return (
    <div className="relative">
      <StreakStrip days={days} />

      {/* progresso da sessão */}
      {total > 0 && (
        <>
          <div className="mb-2 flex gap-1">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  background:
                    i < safeIndex
                      ? 'var(--color-moss)'
                      : i === safeIndex
                        ? 'var(--color-paper)'
                        : 'color-mix(in oklch, var(--color-ash) 25%, transparent)',
                }}
              />
            ))}
          </div>
          <p className="mb-6 text-sm text-[color:var(--color-ash)]">
            Sessão de hoje · item {safeIndex + 1} de {total}
          </p>
        </>
      )}

      {/* item atual */}
      {song ? (
        <SongItem
          key={song.entryId ?? song.id}
          song={song}
          onCycle={(id) => cycle(song, id)}
          onAdvance={() => advance(song)}
          onLogged={addDay}
        />
      ) : exercise ? (
        <ExerciseItem exercise={exercise} onLogged={addDay} />
      ) : (
        <div className="mt-10 text-center">
          <p className="text-lg text-[color:var(--color-paper)]/85">Tudo dominado por aqui 🎉</p>
          <p className="mt-2 text-sm text-[color:var(--color-ash)]">Hora de uma música nova.</p>
          <Link
            href="/biblioteca"
            className="mt-3 inline-block text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4"
          >
            Ir pra Biblioteca →
          </Link>
        </div>
      )}

      {/* navegação da sessão */}
      {total > 1 && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="rounded-md border px-4 py-2 text-sm text-[color:var(--color-paper)] transition-colors hover:border-[color:var(--color-patina)]"
            style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
          >
            ← anterior
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-md px-5 py-2 text-sm text-[color:var(--color-ink)]"
            style={{ background: 'var(--color-patina)' }}
          >
            próximo →
          </button>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-28 z-50 mx-auto w-fit max-w-[90%] rounded-full px-4 py-2 text-sm font-medium text-[color:var(--color-ink)]"
          style={{ background: 'var(--color-moss)' }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function SongItem({
  song,
  onCycle,
  onAdvance,
  onLogged,
}: {
  song: Song
  onCycle: (sectionId: string) => void
  onAdvance: () => void
  onLogged: (day: string) => void
}) {
  const sections = song.sections ?? []
  const pct = Math.round(sectionProgress(sections) * 100)
  const next = firstPending(sections)

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-serif text-4xl leading-tight text-[color:var(--color-paper)]">{song.title}</h2>
        <p className="mt-1 text-lg italic text-[color:var(--color-ash)]">{song.artist}</p>
        {sections.length > 0 && (
          <p className="mt-2 text-sm text-[color:var(--color-ash)] tabular-nums">{pct}% dominado</p>
        )}
      </div>

      {sections.length === 0 ? (
        <p
          className="rounded-lg border p-5 text-sm leading-relaxed text-[color:var(--color-paper)]/80"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
        >
          Essa música ainda não tem partes. Adicione partes (intro, refrão, solo…) na ficha, em{' '}
          <span className="text-[color:var(--color-patina)]">Biblioteca</span>, para praticar por seção.
        </p>
      ) : (
        <ul className="space-y-3">
          {sections.map((s) => {
            const isNext = next?.id === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onCycle(s.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors"
                  style={{
                    borderColor: isNext
                      ? 'color-mix(in oklch, var(--color-patina) 55%, transparent)'
                      : s.status === 'dominada'
                        ? 'color-mix(in oklch, var(--color-moss) 55%, transparent)'
                        : 'color-mix(in oklch, var(--color-ash) 25%, transparent)',
                    background:
                      s.status === 'dominada' ? 'color-mix(in oklch, var(--color-moss) 12%, transparent)' : 'transparent',
                  }}
                >
                  <span className="text-lg text-[color:var(--color-paper)]">{s.name}</span>
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: SECTION_STATUS_COLOR[s.status] }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: SECTION_STATUS_COLOR[s.status] }} />
                    {SECTION_STATUS_LABEL[s.status]}
                  </span>
                </button>
                {s.chords && (
                  <div className="mt-2 px-1">
                    <ChordRow chords={s.chords} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col items-stretch gap-2">
        {next && (
          <button
            type="button"
            onClick={onAdvance}
            className="w-full rounded-lg py-3 text-sm font-medium text-[color:var(--color-ink)] transition-opacity active:opacity-80"
            style={{ background: 'var(--color-moss)' }}
          >
            ✓ concluí a parte “{next.name}”
          </button>
        )}
        <div className="flex justify-center">
          <LogPractice entryId={song.entryId} songId={song.id} variant="ghost" onLogged={onLogged} />
        </div>
      </div>
    </div>
  )
}

function ExerciseItem({ exercise, onLogged }: { exercise: ExerciseSuggestion; onLogged: (day: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Exercício da sessão</p>
      <h2 className="font-serif text-3xl leading-tight text-[color:var(--color-paper)]">{exercise.name}</h2>
      <p className="mt-1 text-sm italic text-[color:var(--color-ash)]">{exercise.skill}</p>
      <p
        className="mt-4 rounded-lg border p-5 text-sm leading-relaxed text-[color:var(--color-paper)]/85"
        style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
      >
        {exercise.desc}
      </p>
      <div className="mt-6 flex justify-center">
        <LogPractice onLogged={onLogged} />
      </div>
      <p className="mt-2 text-center text-xs text-[color:var(--color-ash)]">
        Ajuste o nível dos exercícios na aba <span className="text-[color:var(--color-patina)]">Você</span>.
      </p>
    </div>
  )
}
