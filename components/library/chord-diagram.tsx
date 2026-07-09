// Diagramas de acorde — conhecimento livre, renderizado localmente (não é obra
// licenciada). Portado do protótipo. Array = 6 cordas da mais grave à aguda:
// -1 = abafada (x), 0 = solta, n = casa.

export const CHORD_SHAPES: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0], Cmaj7: [-1, 3, 2, 0, 0, 0], C7: [-1, 3, 2, 3, 1, 0], Cadd9: [-1, 3, 2, 0, 3, 0],
  D: [-1, -1, 0, 2, 3, 2], Dm: [-1, -1, 0, 2, 3, 1], D7: [-1, -1, 0, 2, 1, 2], Dm7: [-1, -1, 0, 2, 1, 1],
  Dsus4: [-1, -1, 0, 2, 3, 3], Dsus2: [-1, -1, 0, 2, 3, 0], Dmaj7: [-1, -1, 0, 2, 2, 2],
  E: [0, 2, 2, 1, 0, 0], Em: [0, 2, 2, 0, 0, 0], E7: [0, 2, 0, 1, 0, 0], Em7: [0, 2, 0, 0, 0, 0], Emaj7: [0, 2, 1, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1], Fmaj7: [-1, -1, 3, 2, 1, 0], Fm: [1, 3, 3, 1, 1, 1],
  G: [3, 2, 0, 0, 0, 3], G7: [3, 2, 0, 0, 0, 1], Gmaj7: [3, 2, 0, 0, 0, 2],
  A: [-1, 0, 2, 2, 2, 0], Am: [-1, 0, 2, 2, 1, 0], A7: [-1, 0, 2, 0, 2, 0], Am7: [-1, 0, 2, 0, 1, 0],
  Asus2: [-1, 0, 2, 2, 0, 0], Asus4: [-1, 0, 2, 2, 3, 0], Amaj7: [-1, 0, 2, 1, 2, 0],
  B7: [-1, 2, 1, 2, 0, 2], Bm: [-1, 2, 4, 4, 3, 2], Bm7: [-1, 2, 0, 2, 0, 2],
}

export function chordShape(name: string): number[] | null {
  return CHORD_SHAPES[name] ?? CHORD_SHAPES[(name || '').split('/')[0]] ?? null
}

export function parseChords(str: string): string[] {
  return (str || '').trim().split(/[\s,|]+/).filter(Boolean)
}

const STRINGS = 6
const FRETS = 4

export function ChordDiagram({ name }: { name: string }) {
  const shape = chordShape(name)
  const W = 44
  const H = 56
  const padX = 6
  const top = 14
  const gridW = W - padX * 2
  const gridH = H - top - 6
  const stepX = gridW / (STRINGS - 1)
  const stepY = gridH / FRETS
  const ash = 'color-mix(in oklch, var(--color-ash) 45%, transparent)'

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        {/* cordas */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line key={`s${i}`} x1={padX + i * stepX} y1={top} x2={padX + i * stepX} y2={top + gridH} stroke={ash} strokeWidth={1} />
        ))}
        {/* trastes */}
        {Array.from({ length: FRETS + 1 }, (_, i) => (
          <line key={`f${i}`} x1={padX} y1={top + i * stepY} x2={padX + gridW} y2={top + i * stepY} stroke={ash} strokeWidth={i === 0 ? 2.5 : 1} />
        ))}
        {/* marcadores x/o + dedos */}
        {shape?.map((fret, i) => {
          const x = padX + i * stepX
          if (fret === -1) return <text key={`m${i}`} x={x} y={top - 4} textAnchor="middle" fontSize={7} fill="var(--color-ash)">×</text>
          if (fret === 0) return <circle key={`m${i}`} cx={x} cy={top - 6} r={2.5} fill="none" stroke="var(--color-ash)" strokeWidth={1} />
          return <circle key={`m${i}`} cx={x} cy={top + (fret - 0.5) * stepY} r={3.5} fill="var(--color-patina)" />
        })}
      </svg>
      <span className="text-[11px] text-[color:var(--color-paper)]/85">{name}</span>
    </div>
  )
}

/** Renderiza uma progressão ("C G Am F") como uma fila de diagramas. */
export function ChordRow({ chords }: { chords: string }) {
  const cs = parseChords(chords)
  if (cs.length === 0) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {cs.map((c, i) => (
        <ChordDiagram key={`${i}-${c}`} name={c} />
      ))}
    </div>
  )
}
