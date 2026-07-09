'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SKILLS } from '@/lib/library/data'
import { EXERCISES, EX_LEVELS, EX_MAX } from '@/lib/library/exercises'

const SKILL_NAME = new Map(SKILLS.map((s) => [s.id, s.name]))
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' } as const

export function ExercisesPanel({
  userId,
  initialLevels,
}: {
  userId: string
  initialLevels: Record<string, number>
}) {
  const [levels, setLevels] = useState<Record<string, number>>(initialLevels)

  async function setLevel(id: string, level: number) {
    setLevels((cur) => ({ ...cur, [id]: level }))
    const supabase = createClient()
    if (level <= 0) {
      await supabase.from('user_exercises').delete().eq('user_id', userId).eq('exercise_id', id)
    } else {
      await supabase
        .from('user_exercises')
        .upsert({ user_id: userId, exercise_id: id, level }, { onConflict: 'user_id,exercise_id' })
    }
  }

  // agrupa por alvo (skill)
  const byAlvo = new Map<string, typeof EXERCISES>()
  for (const e of EXERCISES) {
    const arr = byAlvo.get(e.alvo) ?? []
    arr.push(e)
    byAlvo.set(e.alvo, arr)
  }

  return (
    <section>
      <h2 className="mb-3 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Exercícios</h2>
      <p className="mb-5 max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
        Drills atrelados a uma skill e, quando faz sentido, a uma música — treinar através do repertório.
      </p>
      <div className="space-y-8">
        {[...byAlvo.entries()].map(([alvo, list]) => (
          <div key={alvo}>
            <h3 className="mb-2 font-serif text-[color:var(--color-paper)]">{SKILL_NAME.get(alvo as never) ?? alvo}</h3>
            <ul className="space-y-3">
              {list.map((e) => {
                const level = levels[e.id] ?? 0
                return (
                  <li key={e.id} className="rounded-xl border p-4" style={borderStyle}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[color:var(--color-paper)]">{e.nome}</span>
                      <span className="shrink-0 text-xs tabular-nums text-[color:var(--color-ash)]">dif {e.dif}/5</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-paper)]/70">{e.desc}</p>
                    {e.prep && (
                      <p className="mt-1 text-xs text-[color:var(--color-ash)]">prepara pra <span className="text-[color:var(--color-patina)]">{e.prep}</span></p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      {level === 0 ? (
                        <button
                          type="button"
                          onClick={() => setLevel(e.id, 1)}
                          className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                          style={{ background: 'var(--color-patina)' }}
                        >
                          treinar
                        </button>
                      ) : (
                        <>
                          <span className="text-sm" style={{ color: 'var(--color-moss)' }}>{EX_LEVELS[level]?.nome}</span>
                          {level < EX_MAX && (
                            <button
                              type="button"
                              onClick={() => setLevel(e.id, level + 1)}
                              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                              style={{ background: 'var(--color-moss)' }}
                            >
                              avançar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setLevel(e.id, 0)}
                            className="text-xs uppercase tracking-widest text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
                          >
                            parar
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
