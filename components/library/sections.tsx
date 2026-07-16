'use client'

import { useState } from 'react'
import { SECTION_STATUS_LABEL, sectionProgress, type Section, type Song } from '@/lib/library/data'
import { NEXT_SECTION_STATUS, SECTION_STATUS_COLOR as STATUS_COLOR } from '@/lib/library/section-progress'
import { ChordRow } from './chord-diagram'
import { ChordEditor } from './chord-editor'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `s-${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

export function ProgressBar({ sections }: { sections?: Section[] }) {
  if (!sections || sections.length === 0) return null
  const pct = Math.round(sectionProgress(sections) * 100)
  return (
    <div className="flex items-center gap-2" title={`${pct}% das partes dominadas`}>
      <div
        className="h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-moss)' }} />
      </div>
      <span className="text-xs tabular-nums text-[color:var(--color-ash)]">{pct}%</span>
    </div>
  )
}

export function SectionsBlock({
  song,
  editable,
  onChange,
}: {
  song: Song
  editable?: boolean
  onChange?: (sections: Section[]) => void
}) {
  const [name, setName] = useState('')
  const sections = song.sections ?? []

  function commit(next: Section[]) {
    onChange?.(next)
  }

  function add() {
    const n = name.trim()
    if (!n) return
    commit([...sections, { id: newId(), name: n, status: 'a-fazer' }])
    setName('')
  }

  function cycle(id: string) {
    commit(sections.map((s) => (s.id === id ? { ...s, status: NEXT_SECTION_STATUS[s.status] } : s)))
  }

  function remove(id: string) {
    commit(sections.filter((s) => s.id !== id))
  }

  function setChords(id: string, value: string) {
    commit(sections.map((s) => (s.id === id ? { ...s, chords: value || undefined } : s)))
  }

  if (!editable && sections.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Partes</span>
        <ProgressBar sections={sections} />
      </div>

      {sections.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {sections.map((s) => (
            <li key={s.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={editable ? () => cycle(s.id) : undefined}
                  disabled={!editable}
                  aria-label={`${s.name}: ${SECTION_STATUS_LABEL[s.status]}${editable ? ' (toque p/ avançar)' : ''}`}
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors disabled:cursor-default"
                  style={{ background: editable ? 'color-mix(in oklch, var(--color-paper) 4%, transparent)' : 'transparent' }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                  <span className="text-[color:var(--color-paper)]/90">{s.name}</span>
                  <span className="text-xs" style={{ color: STATUS_COLOR[s.status] }}>
                    {SECTION_STATUS_LABEL[s.status]}
                  </span>
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    aria-label={`Remover ${s.name}`}
                    className="text-xs text-[color:var(--color-ash)] transition-colors hover:text-[color:oklch(0.6_0.15_25)]"
                  >
                    ✕
                  </button>
                )}
              </div>
              {s.chords && <ChordRow chords={s.chords} />}
              {editable && <ChordEditor chords={s.chords ?? ''} onChange={(v) => setChords(s.id, v)} />}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder="+ parte (ex.: intro, refrão, solo)"
            className="rounded-md border bg-transparent px-3 py-1.5 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]"
            style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' }}
          />
          <button
            type="button"
            onClick={add}
            disabled={!name.trim()}
            className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
            style={{ background: 'var(--color-patina)' }}
          >
            adicionar parte
          </button>
        </div>
      )}
    </div>
  )
}
