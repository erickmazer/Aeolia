// Biblioteca Musical — catálogo e tipos (fonte da taxonomia).
//
// As MÚSICAS agora moram no banco (uma biblioteca por usuário). Este arquivo
// guarda só o catálogo fixo compartilhado por todos: técnicas, contextos,
// status e dificuldade — além dos tipos. A semente inicial de músicas está em
// scripts/seed-data.ts.

export type Status = 'quero-aprender' | 'aprendendo' | 'dominada'

export interface StatusMeta {
  id: Status
  label: string
  short: string
  /** Cor de destaque via CSS custom property do design system. */
  color: string
}

export const STATUSES: StatusMeta[] = [
  { id: 'quero-aprender', label: 'Quero aprender', short: 'Fila', color: 'var(--color-ash)' },
  { id: 'aprendendo', label: 'Aprendendo', short: 'Em progresso', color: 'var(--color-patina)' },
  { id: 'dominada', label: 'Dominada', short: 'Dominada', color: 'var(--color-moss)' },
]

/** 1 = mais fácil, 5 = grande desafio. */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Iniciante',
  2: 'Fácil',
  3: 'Intermediário',
  4: 'Avançado',
  5: 'Desafio',
}

// ── Técnicas ────────────────────────────────────────────────────────────────

export type TechniqueId =
  | 'fingerstyle'
  | 'travis-picking'
  | 'independencia-mao-direita'
  | 'bossa-nova'
  | 'harmonicos'
  | 'percussao'
  | 'voicings'
  | 'improvisacao'
  | 'cantar-tocando'

export interface Technique {
  id: TechniqueId
  name: string
  blurb: string
}

export const TECHNIQUES: Technique[] = [
  { id: 'fingerstyle', name: 'Fingerstyle', blurb: 'Dedilhar melodia, baixo e harmonia ao mesmo tempo.' },
  { id: 'travis-picking', name: 'Travis Picking', blurb: 'Baixo alternado com o polegar sob a melodia.' },
  { id: 'independencia-mao-direita', name: 'Independência da mão direita', blurb: 'Cada dedo com sua própria voz e ritmo.' },
  { id: 'bossa-nova', name: 'Bossa Nova', blurb: 'A batida sincopada e o balanço da mão direita.' },
  { id: 'harmonicos', name: 'Harmônicos', blurb: 'Naturais e artificiais — o brilho de sino.' },
  { id: 'percussao', name: 'Percussão', blurb: 'Usar o corpo do instrumento como um tambor.' },
  { id: 'voicings', name: 'Voicings e acordes sofisticados', blurb: 'Tensões, inversões e cores fora do básico.' },
  { id: 'improvisacao', name: 'Improvisação', blurb: 'Frasear livre sobre a harmonia.' },
  { id: 'cantar-tocando', name: 'Cantar enquanto toca', blurb: 'Manter a voz firme com a mão em outro ritmo.' },
]

// ── Contextos ─────────────────────────────────────────────────────────────

export type ContextId =
  | 'para-filha'
  | 'mpb'
  | 'folk-indie'
  | 'pop-rock'
  | 'cantar-junto'
  | 'relaxar'
  | 'estudar-tecnica'
  | 'bosses'

export interface Context {
  id: ContextId
  name: string
  blurb: string
}

export const CONTEXTS: Context[] = [
  { id: 'para-filha', name: 'Para tocar para minha filha', blurb: 'O repertório mais importante de todos.' },
  { id: 'mpb', name: 'MPB', blurb: 'A raiz. Onde a canção e o instrumento se encontram.' },
  { id: 'folk-indie', name: 'Folk / Indie', blurb: 'Dedilhado intimista, letras de perto.' },
  { id: 'pop-rock', name: 'Pop / Rock internacional', blurb: 'Clássicos que todo mundo reconhece.' },
  { id: 'cantar-junto', name: 'Para cantar junto', blurb: 'Roda, fogueira, sala de casa.' },
  { id: 'relaxar', name: 'Para relaxar', blurb: 'Tocar sem plateia, só pelo som.' },
  { id: 'estudar-tecnica', name: 'Para estudar técnica', blurb: 'Músicas que ensinam mais que exercícios.' },
  { id: 'bosses', name: 'Grandes desafios ("Bosses")', blurb: 'As que exigem meses. O objetivo do horizonte.' },
]

// ── Música (ficha) ──────────────────────────────────────────────────────────

export interface Link {
  label: string
  url: string
}

export interface Song {
  id: string
  title: string
  artist: string
  difficulty: Difficulty
  status: Status
  techniques: TechniqueId[]
  contexts: ContextId[]
  /** ids de músicas que convém dominar antes desta. */
  prerequisites: string[]
  /** ids de músicas recomendadas como próximo passo. */
  nextSongs: string[]
  bestVersion?: Link
  bestLesson?: Link
  notes?: string
}

// ── Mapas do catálogo (estáticos) ────────────────────────────────────────────

export const TECHNIQUE_BY_ID: Record<TechniqueId, Technique> = Object.fromEntries(
  TECHNIQUES.map((t) => [t.id, t]),
) as Record<TechniqueId, Technique>

export const CONTEXT_BY_ID: Record<ContextId, Context> = Object.fromEntries(
  CONTEXTS.map((c) => [c.id, c]),
) as Record<ContextId, Context>

export const STATUS_BY_ID: Record<Status, StatusMeta> = Object.fromEntries(
  STATUSES.map((s) => [s.id, s]),
) as Record<Status, StatusMeta>

export const TECHNIQUE_IDS = TECHNIQUES.map((t) => t.id)
export const CONTEXT_IDS = CONTEXTS.map((c) => c.id)

// ── Helpers sobre uma lista de músicas (agora recebem os dados) ─────────────

export function countByStatus(songs: Song[], status: Status): number {
  return songs.filter((s) => s.status === status).length
}

export function songsForTechnique(songs: Song[], id: TechniqueId): Song[] {
  return songs.filter((s) => s.techniques.includes(id))
}

export function songById(songs: Song[]): Record<string, Song> {
  return Object.fromEntries(songs.map((s) => [s.id, s]))
}
