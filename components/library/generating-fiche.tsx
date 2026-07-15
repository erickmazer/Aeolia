'use client'

import { useEffect, useState } from 'react'

const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

// Etapas ilustrativas: não há stream de progresso do servidor, então a copy
// avança num timer e "estaciona" na última até a resposta chegar. Comunica que
// algo está acontecendo sem prometer um progresso real.
const STEPS = [
  'Consultando o catálogo…',
  'Compondo a ficha com IA…',
  'Definindo dificuldade e técnicas…',
  'Sugerindo partes e acordes…',
]
const STEP_MS = 1500

// Capas do iTunes vêm em 60×60; sobe pra 200 pra ficar nítida no herói.
function hiRes(url: string): string {
  return url.replace(/\/\d+x\d+bb\./, '/200x200bb.')
}

/**
 * Estado de "gerando ficha" — herói com a capa do álbum (quando veio do
 * autocomplete), título/artista em destaque, microcopy em etapas e um skeleton
 * da ficha com shimmer. Substitui a antiga label discreta "gerando ficha…".
 */
export function GeneratingFiche({
  title,
  artist,
  artwork,
}: {
  title: string
  artist: string
  artwork?: string | null
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, STEP_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="aeolia-rise rounded-lg border p-5"
      style={borderStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        {/* Capa (herói) */}
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
          style={{ background: 'color-mix(in oklch, var(--color-paper) 8%, transparent)' }}
        >
          {artwork ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hiRes(artwork)} alt="" className="h-full w-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: 'color-mix(in oklch, var(--color-ink) 30%, transparent)' }}
              />
            </>
          ) : (
            <div className="skeleton absolute inset-0 flex items-center justify-center text-2xl text-[color:var(--color-ash)]">
              ♪
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-lg leading-tight text-[color:var(--color-paper)]">
            {title}
          </div>
          <div className="truncate text-sm italic text-[color:var(--color-ash)]">{artist}</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-[color:var(--color-patina)]">
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span className="truncate transition-opacity">{STEPS[step]}</span>
          </div>
        </div>
      </div>

      {/* Skeleton da ficha (espelha o layout que vai aparecer no review) */}
      <div className="mt-6 space-y-4">
        <div className="flex gap-2">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[16, 20, 14, 18].map((w, i) => (
            <div key={i} className="skeleton h-7 rounded-full" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-11/12 rounded" />
          <div className="skeleton h-3.5 w-4/5 rounded" />
        </div>
      </div>
    </div>
  )
}
