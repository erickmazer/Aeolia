'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { MusicSearchResult } from '@/app/api/music-search/route'
import { Spinner } from '@/components/app/spinner'

const inputClass =
  'rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]'
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

const MIN_CHARS = 2
const DEBOUNCE_MS = 250

interface SongSearchProps {
  onPick: (song: { title: string; artist: string; artwork?: string | null }) => void
  disabled?: boolean
}

export function SongSearch({ onPick, disabled }: SongSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MusicSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [searched, setSearched] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  // Busca com debounce + cancelamento das requisições obsoletas.
  useEffect(() => {
    const term = query.trim()
    const timer = setTimeout(async () => {
      if (term.length < MIN_CHARS) {
        abortRef.current?.abort()
        setResults([])
        setLoading(false)
        setSearched(false)
        setActive(-1)
        return
      }

      setLoading(true)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/music-search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        })
        const payload = (await res.json().catch(() => ({}))) as { results?: MusicSearchResult[] }
        setResults(res.ok ? payload.results ?? [] : [])
        setSearched(true)
        setActive(-1)
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') {
          setResults([])
          setSearched(true)
        }
      } finally {
        // Só desliga o loading se essa requisição ainda é a atual.
        if (abortRef.current === controller) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(result: MusicSearchResult) {
    onPick({ title: result.title, artist: result.artist, artwork: result.artwork })
    setQuery('')
    setResults([])
    setOpen(false)
    setActive(-1)
    setSearched(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : -1))
    } else if (e.key === 'Enter') {
      if (active >= 0 && results[active]) {
        e.preventDefault()
        pick(results[active])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showList = open && query.trim().length >= MIN_CHARS
  const showEmpty = showList && !loading && searched && results.length === 0

  return (
    <div ref={rootRef} className="relative">
      <input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
        className={`${inputClass} w-full`}
        style={borderStyle}
        placeholder="Buscar música…"
        value={query}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showList && (loading || results.length > 0 || showEmpty) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-md border py-1 shadow-lg"
          style={{
            ...borderStyle,
            background: 'color-mix(in oklch, var(--color-ink) 92%, var(--color-paper))',
          }}
        >
          {loading && results.length === 0 && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm italic text-[color:var(--color-ash)]">
              <Spinner /> buscando…
            </li>
          )}

          {results.map((r, i) => (
            <li
              key={`${r.title}-${r.artist}-${i}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className="flex cursor-pointer items-center gap-3 px-3 py-2"
              style={{
                background:
                  i === active ? 'color-mix(in oklch, var(--color-patina) 18%, transparent)' : 'transparent',
              }}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(r)
              }}
            >
              {r.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.artwork}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded"
                />
              ) : (
                <div
                  className="h-10 w-10 shrink-0 rounded"
                  style={{ background: 'color-mix(in oklch, var(--color-ash) 20%, transparent)' }}
                />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm text-[color:var(--color-paper)]">
                  {r.title} <span className="text-[color:var(--color-ash)]">— {r.artist}</span>
                </div>
                {r.genre && (
                  <div className="truncate text-xs text-[color:var(--color-ash)]">{r.genre}</div>
                )}
              </div>
            </li>
          ))}

          {showEmpty && (
            <li className="px-3 py-2 text-sm italic text-[color:var(--color-ash)]">
              Nada encontrado — adicione manualmente.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
