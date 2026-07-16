'use client'

import { createClient } from '@/lib/supabase/client'
import {
  addDays,
  computeStreak,
  daysThisWeek,
  localDay,
  practicedToday,
  type PracticeSummary,
} from '@/lib/library/practice'

const HEATMAP_WEEKS = 13

// Cor da célula do heatmap por intensidade (nº de sessões no dia).
function cellColor(count: number): string {
  if (count <= 0) return 'color-mix(in oklch, var(--color-ash) 14%, transparent)'
  if (count >= 3) return 'var(--color-moss)'
  if (count === 2) return 'color-mix(in oklch, var(--color-moss) 62%, transparent)'
  return 'color-mix(in oklch, var(--color-moss) 36%, transparent)'
}

// Stats da aba Você — cálculo de streak/semana no client (respeita o fuso local).
export function YouStats({ summary }: { summary: PracticeSummary }) {
  const today = localDay()
  const { current, longest } = computeStreak(summary.days, today)
  const week = daysThisWeek(summary.days, today)

  // Heatmap ~13 semanas: colunas = semanas, linhas = dias (seg→dom). A última
  // célula (canto) é hoje; dias futuros da semana corrente ficam vazios.
  const todayDow = (new Date().getDay() + 6) % 7 // seg=0
  const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      const daysAgo = (HEATMAP_WEEKS - 1 - c) * 7 + (todayDow - r)
      if (daysAgo < 0) return null
      const day = addDays(today, -daysAgo)
      return { day, count: summary.byDay[day]?.count ?? 0, minutes: summary.byDay[day]?.minutes ?? 0 }
    }),
  )

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
            style={{
              borderColor: 'color-mix(in oklch, var(--color-ash) 18%, transparent)',
              background: 'linear-gradient(to bottom, color-mix(in oklch, var(--color-paper) 5%, transparent), transparent)',
              boxShadow: '0 8px 24px -18px rgba(0,0,0,0.8)',
            }}
          >
            <div className="font-serif text-2xl tabular-nums text-[color:var(--color-paper)]">{t.n}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-ash)]">{t.l}</div>
          </div>
        ))}
      </div>

      {/* Heatmap de prática (~13 semanas) */}
      <div className="mt-4 flex gap-1">
        {weeks.map((col, c) => (
          <div key={c} className="flex flex-1 flex-col gap-1">
            {col.map((cell, r) => (
              <span
                key={r}
                className="aspect-square w-full rounded-[3px]"
                style={{ background: cell ? cellColor(cell.count) : 'transparent' }}
                title={cell ? `${cell.day} · ${cell.count} ${cell.count === 1 ? 'sessão' : 'sessões'}` : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-[color:var(--color-ash)]">
        <span>menos</span>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: cellColor(n) }} />
        ))}
        <span>mais</span>
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
          className="shrink-0 rounded-md border px-4 py-2 text-sm text-[color:var(--color-paper)] transition-all hover:border-[color:var(--color-patina)] active:scale-95"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
        >
          sair
        </button>
      </div>
    </section>
  )
}
