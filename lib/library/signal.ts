// Sinal do usuário — derivado da biblioteca, SEM IA.
// Entrada da personalização (e ponto de override da futura mecânica de "refinar").

import type { Song, TechniqueId, Difficulty } from './data'

export type Momento = 'inicio' | 'avancando' | 'consolidando'

export interface WeightedTag<T> {
  id: T
  score: number
}

export interface UserSignal {
  total: number
  dominadas: number
  aprendendo: number
  /** nível estimado 1–5 (maior dificuldade dominada, com folga p/ quem só está aprendendo). */
  nivel: number
  /** dificuldade que a pessoa está encarando agora (topo do "aprendendo"/"quero"). */
  encarando: number
  momento: Momento
  gostoTecnicas: WeightedTag<TechniqueId>[]
  gostoGeneros: WeightedTag<string>[]
}

const STATUS_WEIGHT: Record<Song['status'], number> = {
  dominada: 2,
  aprendendo: 1.5,
  'quero-aprender': 1,
}

function topTags<T extends string>(counts: Map<T, number>, n: number): WeightedTag<T>[] {
  return [...counts.entries()]
    .map(([id, score]) => ({ id, score: Math.round(score * 10) / 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

export function deriveSignal(songs: Song[]): UserSignal {
  const total = songs.length
  const dominadas = songs.filter((s) => s.status === 'dominada').length
  const aprendendo = songs.filter((s) => s.status === 'aprendendo').length

  const maxDominada = songs
    .filter((s) => s.status === 'dominada')
    .reduce((m, s) => Math.max(m, s.difficulty), 0)
  const maxAprendendo = songs
    .filter((s) => s.status !== 'dominada')
    .reduce((m, s) => Math.max(m, s.difficulty), 0)

  // Nível: o que já domina; se ainda não dominou nada, um pouco abaixo do que encara.
  const nivel = maxDominada > 0 ? maxDominada : Math.max(1, maxAprendendo - 1)
  const encarando = Math.max(nivel, maxAprendendo) as Difficulty | number

  const tecCounts = new Map<TechniqueId, number>()
  const genCounts = new Map<string, number>()
  for (const s of songs) {
    const w = STATUS_WEIGHT[s.status]
    for (const t of s.techniques) tecCounts.set(t, (tecCounts.get(t) ?? 0) + w)
    if (s.genre) genCounts.set(s.genre, (genCounts.get(s.genre) ?? 0) + w)
  }

  const ratio = total > 0 ? dominadas / total : 0
  const momento: Momento = total === 0 ? 'inicio' : ratio < 0.2 ? 'inicio' : ratio < 0.5 ? 'avancando' : 'consolidando'

  return {
    total,
    dominadas,
    aprendendo,
    nivel,
    encarando,
    momento,
    gostoTecnicas: topTags(tecCounts, 5),
    gostoGeneros: topTags(genCounts, 5),
  }
}
