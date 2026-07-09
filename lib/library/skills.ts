// XP de skill derivado da biblioteca (issue: SKILL/XP do modelo do protótipo).
// XP por técnica = soma de (peso do status × dificuldade × passo) nas músicas
// que treinam a técnica. (Fundamentos ganham XP de exercícios — fatia 6b.)

import { TECHNIQUES, type Song, type TechniqueId } from './data'

const STATUS_MULT: Record<Song['status'], number> = {
  'quero-aprender': 0,
  aprendendo: 0.4,
  dominada: 1,
}
const LEVEL_STEP = 150

export interface SkillXp {
  id: TechniqueId
  name: string
  xp: number
}

export function deriveSkillXp(songs: Song[]): SkillXp[] {
  const xp = new Map<TechniqueId, number>(TECHNIQUES.map((t) => [t.id, 0]))
  for (const s of songs) {
    const mult = STATUS_MULT[s.status]
    if (mult === 0) continue
    for (const t of s.techniques) xp.set(t, (xp.get(t) ?? 0) + mult * s.difficulty * LEVEL_STEP)
  }
  return TECHNIQUES.map((t) => ({ id: t.id, name: t.name, xp: Math.round(xp.get(t.id) ?? 0) }))
}
