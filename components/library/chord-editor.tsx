'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CHORD_SHAPES, ChordDiagram, chordShape, parseChords } from './chord-diagram'

const ALL_CHORDS = Object.keys(CHORD_SHAPES)

/**
 * Editor de acordes por seção — chips removíveis + picker visual com
 * autocomplete (cada sugestão mostra o próprio diagrama). Substitui o input de
 * texto cru: editar um acorde não quebra a progressão inteira, o vocabulário é
 * descoberto no picker, e acordes fora do catálogo (regionais) ainda entram por
 * digitação livre — só marcados como "sem diagrama".
 */
export function ChordEditor({ chords, onChange }: { chords: string; onChange: (chords: string) => void }) {
  const list = parseChords(chords)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function commit(next: string[]) {
    onChange(next.join(' '))
  }
  function add(chord: string) {
    const v = chord.trim()
    if (!v) return
    commit([...list, v])
    setQuery('')
    setOpen(false)
  }
  function removeAt(i: number) {
    commit(list.filter((_, idx) => idx !== i))
  }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = q ? ALL_CHORDS.filter((n) => n.toLowerCase().includes(q)) : ALL_CHORDS
    return pool.slice(0, 12)
  }, [query])

  return (
    <div className="space-y-2">
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((c, i) => {
            const known = !!chordShape(c)
            return (
              <span
                key={`${i}-${c}`}
                className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-sm"
                style={{
                  color: 'var(--color-paper)',
                  background: 'color-mix(in oklch, var(--color-paper) 6%, transparent)',
                  border: `1px solid color-mix(in oklch, ${known ? 'var(--color-patina)' : 'oklch(0.65 0.13 60)'} 45%, transparent)`,
                }}
              >
                {c}
                {!known && (
                  <span title="Acorde sem diagrama no catálogo" aria-label="sem diagrama" className="text-[color:oklch(0.72_0.13_60)]">
                    ⚠
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remover ${c}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-ash)] transition-colors hover:bg-[color:color-mix(in_oklch,var(--color-paper)_12%,transparent)] hover:text-[color:var(--color-paper)]"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      <div ref={rootRef} className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(matches[0] ?? query)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder="+ acorde (ex.: Am7)"
          aria-label="Adicionar acorde"
          autoComplete="off"
          className="w-full max-w-xs rounded-md border bg-transparent px-3 py-1.5 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]"
          style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
        />

        {open && matches.length > 0 && (
          <div
            className="absolute z-20 mt-1 grid max-h-64 grid-cols-4 gap-1 overflow-auto rounded-md border p-2 shadow-lg"
            style={{
              borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)',
              background: 'color-mix(in oklch, var(--color-ink) 92%, var(--color-paper))',
            }}
          >
            {matches.map((n) => (
              <button
                key={n}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  add(n)
                }}
                className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-[color:color-mix(in_oklch,var(--color-patina)_16%,transparent)]"
                title={`Adicionar ${n}`}
              >
                <ChordDiagram name={n} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
