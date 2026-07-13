'use client'

import { createClient } from '@/lib/supabase/client'
import {
  computeStreak,
  daysThisWeek,
  localDay,
  practicedToday,
  type PracticeSummary,
} from '@/lib/library/practice'

// Stats da aba Você — cálculo de streak/semana no client (respeita o fuso local).
export function YouStats({ summary }: { summary: PracticeSummary }) {
  const today = localDay()
  const { current, longest } = computeStreak(summary.days, today)
  const week = daysThisWeek(summary.days, today)
  const set = new Set(summary.days)
  const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dow = (d.getDay() + 6) % 7 // seg=0
    return { on: set.has(localDay(d)), label: labels[dow] }
  })

  const tiles = [
    { n: current, l: current === 1 ? 'dia de streak' : 'dias de streak' },
    { n: longest, l: 'maior streak' },
    { n: summary.totalSessions, l: 'sessões' },
    { n: summary.totalMinutes, l: 'minutos' },
  ]

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Seu ritmo</h2>
        <span className="text-xs text-[color:var(--color-ash)]">
          {practicedToday(summary.days, today) ? 'praticado hoje ✓' : `${week}/7 esta semana`}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div
            key={t.l}
            className="rounded-xl border px-2 py-3 text-center"
            style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 20%, transparent)' }}
          >
            <div className="font-serif text-2xl tabular-nums text-[color:var(--color-paper)]">{t.n}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-ash)]">{t.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-1.5">
        {dots.map((d, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1"
            title={d.on ? 'praticado' : 'sem prática'}
          >
            <span
              className="h-8 w-full rounded-md"
              style={{ background: d.on ? 'var(--color-moss)' : 'color-mix(in oklch, var(--color-ash) 16%, transparent)' }}
            />
            <span className="text-[10px] text-[color:var(--color-ash)]">{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// Conta — perfil + sair. Traz o "sair" (antes só no header) pra dentro de Você.
export function AccountSection({ label }: { label: string }) {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/musician/erick'
  }

  return (
    <section
      className="mt-12 border-t pt-8"
      style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 18%, transparent)' }}
    >
      <h2 className="mb-3 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Conta</h2>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-[color:var(--color-paper)]/90">{label}</span>
        <button
          type="button"
          onClick={signOut}
          className="shrink-0 rounded-md border px-4 py-2 text-sm text-[color:var(--color-paper)] transition-colors hover:border-[color:var(--color-patina)]"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
        >
          sair
        </button>
      </div>
    </section>
  )
}
