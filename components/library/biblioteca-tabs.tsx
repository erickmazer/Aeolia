'use client'

import { useState } from 'react'

// Alterna entre Músicas e Materiais na Biblioteca — mostra um de cada vez, em
// vez de empilhar as duas listas numa página longa (linguagem mobile focada).
// Recebe os dois conteúdos como slots (server components) e só troca qual mostra.
export function BibliotecaTabs({ musicas, materiais }: { musicas: React.ReactNode; materiais: React.ReactNode }) {
  const [tab, setTab] = useState<'musicas' | 'materiais'>('musicas')

  return (
    <div>
      <div
        className="mb-8 inline-flex gap-1 rounded-lg p-1"
        style={{ background: 'color-mix(in oklch, var(--color-ash) 14%, transparent)' }}
      >
        {(['musicas', 'materiais'] as const).map((t) => {
          const sel = tab === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={sel}
              className="rounded-md px-4 py-1.5 text-sm transition-colors"
              style={{
                background: sel ? 'var(--color-patina)' : 'transparent',
                color: sel ? 'var(--color-ink)' : 'var(--color-ash)',
              }}
            >
              {t === 'musicas' ? 'Músicas' : 'Materiais'}
            </button>
          )
        })}
      </div>

      <div hidden={tab !== 'musicas'}>{musicas}</div>
      <div hidden={tab !== 'materiais'}>{materiais}</div>
    </div>
  )
}
