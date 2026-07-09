'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { localDay } from '@/lib/library/practice'

interface Props {
  entryId?: string
  songId?: string
  sectionId?: string
  /** chamado após gravar, com o dia local — pra atualizar streak otimista. */
  onLogged?: (day: string) => void
  variant?: 'solid' | 'ghost'
  className?: string
}

/**
 * Registro de prática em 1 toque (issue #7). Grava uma linha em practice_logs
 * com o dia local do usuário. Sem Supabase/login, o clique é inócuo (fail-safe).
 * "+min" é opcional — o toque principal não exige preencher nada.
 */
export function LogPractice({ entryId, songId, sectionId, onLogged, variant = 'solid', className = '' }: Props) {
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')
  const [showMin, setShowMin] = useState(false)
  const [minutes, setMinutes] = useState('')

  async function log() {
    if (state === 'saving') return
    setState('saving')
    const day = localDay()
    const mins = minutes.trim() ? Math.max(0, Math.min(1440, parseInt(minutes, 10) || 0)) : null
    try {
      const supabase = createClient()
      const { error } = await supabase.from('practice_logs').insert({
        entry_id: entryId ?? null,
        song_id: songId ?? null,
        section_id: sectionId ?? null,
        minutes: mins,
        local_day: day,
      })
      if (error) throw error
      setState('done')
      setShowMin(false)
      setMinutes('')
      onLogged?.(day)
      window.setTimeout(() => setState('idle'), 2200)
    } catch {
      setState('idle')
    }
  }

  const solid = variant === 'solid'
  const base =
    'rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ' +
    (solid
      ? 'text-[color:var(--color-ink)]'
      : 'border text-[color:var(--color-paper)] hover:border-[color:var(--color-patina)]')

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={log}
        disabled={state === 'saving'}
        className={base}
        style={
          solid
            ? { background: state === 'done' ? 'var(--color-moss)' : 'var(--color-patina)' }
            : { borderColor: 'color-mix(in oklch, var(--color-ash) 30%, transparent)' }
        }
      >
        {state === 'done' ? '✓ Registrado' : state === 'saving' ? 'Salvando…' : '＋ Pratiquei'}
      </button>

      {showMin ? (
        <span className="inline-flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && log()}
            placeholder="min"
            className="w-16 rounded-md border bg-transparent px-2 py-1 text-sm text-[color:var(--color-paper)] outline-none"
            style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 30%, transparent)' }}
            autoFocus
          />
        </span>
      ) : (
        state === 'idle' && (
          <button
            type="button"
            onClick={() => setShowMin(true)}
            className="text-xs text-[color:var(--color-ash)] underline decoration-1 underline-offset-4 hover:text-[color:var(--color-paper)]"
          >
            +min
          </button>
        )
      )}
    </div>
  )
}
