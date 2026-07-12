// Conversão de frequência (Hz) → nota + desvio em cents. Puro/isomórfico (sem
// dependência), usado pelo afinador. Referência A4 = 440 Hz, temperamento igual.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export interface NoteReading {
  /** Nome da nota mais próxima (ex.: "E", "A#"). */
  note: (typeof NOTE_NAMES)[number]
  /** Oitava científica (A4 = 440 Hz). */
  octave: number
  /** Desvio da nota exata, em cents (−50..+50). Negativo = grave, positivo = agudo. */
  cents: number
  /** Frequência exata da nota mais próxima (alvo). */
  refHz: number
  /** Rótulo pronto: "A#3". */
  label: string
}

/**
 * Mapeia uma frequência para a nota mais próxima. Retorna null pra entradas
 * inválidas (≤ 0, NaN, ±Infinity) — o afinador nunca deve chamar com lixo, mas
 * mantém a função total.
 */
export function hzToNote(hz: number): NoteReading | null {
  if (!Number.isFinite(hz) || hz <= 0) return null

  // Semitons a partir de A4. midi 69 = A4.
  const semitonesFromA4 = 12 * Math.log2(hz / 440)
  const midi = Math.round(semitonesFromA4) + 69

  const refHz = 440 * Math.pow(2, (midi - 69) / 12)
  const cents = Math.round(1200 * Math.log2(hz / refHz))

  const note = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1

  return { note, octave, cents, refHz, label: `${note}${octave}` }
}
