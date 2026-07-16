'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loading } from '@/components/app/spinner'
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
// `isOwner` (dono da vitrine) libera manutenções, como o backfill de capas.
export function AccountSection({ label, isOwner }: { label: string; isOwner?: boolean }) {
  const [backfill, setBackfill] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/musician/erick'
  }

  async function fillCovers() {
    setBackfill('running')
    setMsg('')
    try {
      const res = await fetch('/api/backfill-artwork', { method: 'POST' })
      const payload = (await res.json().catch(() => ({}))) as {
        updated?: number
        remaining?: number | null
        error?: string
      }
      if (!res.ok) throw new Error(payload.error ?? `Erro ${res.status}`)
      const { updated = 0, remaining } = payload
      setMsg(`${updated} ${updated === 1 ? 'capa preenchida' : 'capas preenchidas'}${remaining ? ` · ${remaining} restantes` : ' · tudo em dia'}`)
      setBackfill('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao preencher capas.')
      setBackfill('error')
    }
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

      {isOwner && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Manutenção</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fillCovers}
              disabled={backfill === 'running'}
              className="rounded-md border px-4 py-2 text-sm text-[color:var(--color-paper)] transition-all hover:border-[color:var(--color-patina)] active:scale-95 disabled:opacity-50"
              style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
            >
              {backfill === 'running' ? <Loading>preenchendo…</Loading> : 'preencher capas faltantes'}
            </button>
            {msg && (
              <span
                className="text-xs"
                style={{ color: backfill === 'error' ? 'oklch(0.65 0.15 25)' : 'var(--color-ash)' }}
              >
                {msg}
              </span>
            )}
          </div>
          {backfill === 'done' && (msg.includes('restantes')) && (
            <p className="mt-1.5 text-xs text-[color:var(--color-ash)]">Clique de novo pra continuar o lote.</p>
          )}
        </div>
      )}
    </section>
  )
}
