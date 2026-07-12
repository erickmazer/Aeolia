'use client'

import { useEffect, useRef, useState } from 'react'
import { Metronome } from './metronome'
import { Tuner } from './tuner'

// Folha sobreposta com as ferramentas globais (metrônomo + afinador). Aberta pelo
// header do AppShell, então fica acessível de qualquer área sem virar aba. O
// conteúdo só monta quando aberta — ao fechar, Metronome/Tuner desmontam e
// liberam AudioContext/microfone nos seus próprios cleanups.

type Tab = 'metronomo' | 'afinador'

export function ToolsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('metronomo')
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // trava o scroll do fundo enquanto a folha está aberta
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ferramentas"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Fechar ferramentas"
        onClick={onClose}
        className="absolute inset-0 motion-safe:animate-[fadeIn_120ms_ease-out]"
        style={{ background: 'color-mix(in oklch, var(--color-ink) 70%, transparent)' }}
      />

      {/* painel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-[480px] rounded-t-2xl px-5 pb-8 pt-4 outline-none motion-safe:animate-[sheetUp_180ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{
          background: 'color-mix(in oklch, var(--color-ink) 94%, var(--color-paper))',
          borderTop: '1px solid color-mix(in oklch, var(--color-ash) 22%, transparent)',
          boxShadow: '0 -20px 50px -20px rgba(0,0,0,0.6)',
        }}
      >
        {/* alça */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'color-mix(in oklch, var(--color-ash) 40%, transparent)' }} />

        {/* abas */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'color-mix(in oklch, var(--color-ash) 14%, transparent)' }}>
            {(['metronomo', 'afinador'] as Tab[]).map((t) => {
              const sel = tab === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-pressed={sel}
                  className="rounded-md px-4 py-1.5 text-sm capitalize transition-colors"
                  style={{
                    background: sel ? 'var(--color-patina)' : 'transparent',
                    color: sel ? 'var(--color-ink)' : 'var(--color-ash)',
                  }}
                >
                  {t === 'metronomo' ? 'metrônomo' : 'afinador'}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
          >
            ✕
          </button>
        </div>

        {tab === 'metronomo' ? <Metronome /> : <Tuner />}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
