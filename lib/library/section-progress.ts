// Progresso das partes (seções) de uma música — lógica pura, compartilhada.
// Antes esta tabela e estes helpers viviam duplicados em today-cockpit,
// practice-mode e sections.tsx; centralizados aqui.

import type { Section, SectionStatus, Song } from './data'

// Ciclo de status ao tocar numa parte: a-fazer → praticando → dominada → a-fazer.
export const NEXT_SECTION_STATUS: Record<SectionStatus, SectionStatus> = {
  'a-fazer': 'praticando',
  praticando: 'dominada',
  dominada: 'a-fazer',
}

export const SECTION_STATUS_COLOR: Record<SectionStatus, string> = {
  'a-fazer': 'var(--color-ash)',
  praticando: 'var(--color-patina)',
  dominada: 'var(--color-moss)',
}

/** Avança o status de uma parte específica (ciclo). Retorna novo array. */
export function cycleSection(sections: Section[], id: string): Section[] {
  return sections.map((s) => (s.id === id ? { ...s, status: NEXT_SECTION_STATUS[s.status] } : s))
}

/** A primeira parte ainda não dominada (a "próxima" a trabalhar), ou undefined. */
export function firstPending(sections: Section[]): Section | undefined {
  return sections.find((s) => s.status !== 'dominada')
}

/** Avança a primeira parte pendente um passo no ciclo. Retorna novo array (igual se não há pendente). */
export function advanceFirstPending(sections: Section[]): Section[] {
  const idx = sections.findIndex((s) => s.status !== 'dominada')
  if (idx < 0) return sections
  return sections.map((s, i) => (i === idx ? { ...s, status: NEXT_SECTION_STATUS[s.status] } : s))
}

/** Música "dominada": todas as partes dominadas (ou status salvo, se sem partes). */
export function isDone(song: Song): boolean {
  const secs = song.sections ?? []
  if (secs.length > 0) return secs.every((s) => s.status === 'dominada')
  return song.status === 'dominada'
}

/** Música "ativa": não dominada e já começada (aprendendo, ou alguma parte iniciada). */
export function isActive(song: Song): boolean {
  if (isDone(song)) return false
  if (song.status === 'aprendendo') return true
  return (song.sections ?? []).some((s) => s.status !== 'a-fazer')
}
