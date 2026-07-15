// Biblioteca do Violonista — catálogo e tipos (fonte da taxonomia).
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
  | 'baixos-alternados'
  | 'independencia'
  | 'bossa-nova'
  | 'harmonia'
  | 'dinamica'

export interface Technique {
  id: TechniqueId
  name: string
  blurb: string
}

export const TECHNIQUES: Technique[] = [
  { id: 'fingerstyle', name: 'Fingerstyle', blurb: 'Dedilhar melodia, baixo e harmonia ao mesmo tempo.' },
  { id: 'travis-picking', name: 'Travis Picking', blurb: 'Baixo alternado com o polegar sob a melodia.' },
  { id: 'baixos-alternados', name: 'Baixos alternados', blurb: 'Polegar alternando tônica e quinta — base de folk/country.' },
  { id: 'independencia', name: 'Independência', blurb: 'Cada mão (e dedo) com sua própria voz e ritmo.' },
  { id: 'bossa-nova', name: 'Bossa Nova', blurb: 'A batida sincopada e o balanço da mão direita.' },
  { id: 'harmonia', name: 'Harmonia', blurb: 'Campos, tensões, inversões — entender por que funciona.' },
  { id: 'dinamica', name: 'Dinâmica', blurb: 'Controle de volume e intenção — do pianíssimo ao forte.' },
]

// ── Skills = as 7 técnicas + fundamentos (para exercícios e XP) ──────────────
export type SkillId = TechniqueId | 'troca-acordes' | 'ritmo'
export interface Skill {
  id: SkillId
  name: string
  tipo: 'tecnica' | 'fundamento'
}
export const SKILLS: Skill[] = [
  ...TECHNIQUES.map((t) => ({ id: t.id as SkillId, name: t.name, tipo: 'tecnica' as const })),
  { id: 'troca-acordes', name: 'Troca de acordes', tipo: 'fundamento' },
  { id: 'ritmo', name: 'Ritmo', tipo: 'fundamento' },
]

// ── Técnicas típicas por gênero (item 7) — semente pra recomendação ─────────
export const GENRE_TECHS: Record<string, TechniqueId[]> = {
  MPB: ['harmonia', 'bossa-nova', 'dinamica'],
  'Bossa Nova': ['bossa-nova', 'harmonia', 'independencia'],
  Folk: ['fingerstyle', 'travis-picking', 'baixos-alternados'],
  Indie: ['fingerstyle', 'dinamica', 'harmonia'],
  Instrumental: ['fingerstyle', 'independencia', 'travis-picking'],
  Blues: ['baixos-alternados', 'dinamica'],
  Sertanejo: ['baixos-alternados', 'dinamica'],
  Samba: ['harmonia', 'dinamica'],
  Jazz: ['harmonia', 'independencia'],
  'Clássico': ['fingerstyle', 'independencia', 'dinamica'],
  Country: ['travis-picking', 'baixos-alternados'],
  Infantil: ['dinamica', 'harmonia'],
  Rock: ['dinamica'],
  Pop: ['harmonia', 'dinamica'],
}

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
  { id: 'mpb', name: 'MPB', blurb: 'A raiz. Onde o violão e a canção se encontram.' },
  { id: 'folk-indie', name: 'Folk / Indie', blurb: 'Violão de dedo, letras de perto.' },
  { id: 'pop-rock', name: 'Pop / Rock internacional', blurb: 'Clássicos que todo mundo reconhece.' },
  { id: 'cantar-junto', name: 'Para cantar junto', blurb: 'Roda, fogueira, sala de casa.' },
  { id: 'relaxar', name: 'Para relaxar', blurb: 'Tocar sem plateia, só pelo som.' },
  { id: 'estudar-tecnica', name: 'Para estudar técnica', blurb: 'Músicas que ensinam mais que exercícios.' },
  { id: 'bosses', name: 'Grandes desafios ("Bosses")', blurb: 'As que exigem meses. O objetivo do horizonte.' },
]

// ── Gênero (canônico, single) — item 1: eixo separado dos contextos ──────────
export const GENRES = [
  'MPB', 'Bossa Nova', 'Folk', 'Indie', 'Instrumental', 'Rock', 'Pop',
  'Blues', 'Sertanejo', 'Samba', 'Jazz', 'Clássico', 'Country', 'Infantil',
] as const

// ── Prioridade de aprendizado (privado) — NÃO confundir com status ──────────
export type Priority = 'agora' | 'proxima' | 'algumdia'
export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'agora', label: 'Agora', color: 'var(--color-patina)' },
  { id: 'proxima', label: 'Próxima', color: 'var(--color-moss)' },
  { id: 'algumdia', label: 'Algum dia', color: 'var(--color-ash)' },
]

// ── Stage: ciclo de vida da música na biblioteca (privado) ──────────────────
export type Stage = 'backlog' | 'biblioteca' | 'arquivada'
export const STAGES: { id: Stage; label: string }[] = [
  { id: 'backlog', label: 'Caixa de entrada' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'arquivada', label: 'Arquivada' },
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
  /** id da library_entry do usuário (só em views pessoais — p/ editar/remover). */
  entryId?: string
  /** nota privada do usuário sobre a música (não canônica). */
  personalNote?: string
  /** partes/seções da música e o progresso do usuário em cada uma. */
  sections?: Section[]
  /** gênero canônico (público). Ex.: MPB, Folk, Rock. */
  genre?: string
  /** URL da capa do álbum (canônica, vinda do autocomplete). */
  artwork?: string
  /** coleções pessoais (labels livres do usuário). Ex.: Aurora, Favoritas. */
  collections?: string[]
  /** prioridade de aprendizado (privado). */
  priority?: Priority | null
  /** ciclo de vida na biblioteca (privado). */
  stage?: Stage
}

// ── Progresso por partes (issue #5) ──────────────────────────────────────────
export type SectionStatus = 'a-fazer' | 'praticando' | 'dominada'

export interface Section {
  id: string
  name: string
  status: SectionStatus
  /** progressão de acordes da parte (ex.: "C G Am F"). Conhecimento livre. */
  chords?: string
}

export const SECTION_STATUS_LABEL: Record<SectionStatus, string> = {
  'a-fazer': 'A fazer',
  praticando: 'Praticando',
  dominada: 'Dominada',
}

/** Fração de partes dominadas (0–1). 0 se não há partes. */
export function sectionProgress(sections: Section[] | undefined): number {
  if (!sections || sections.length === 0) return 0
  return sections.filter((s) => s.status === 'dominada').length / sections.length
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

export const PRIORITY_BY_ID: Record<Priority, { id: Priority; label: string; color: string }> =
  Object.fromEntries(PRIORITIES.map((p) => [p.id, p])) as Record<Priority, { id: Priority; label: string; color: string }>

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

// ── Materiais (links + arquivos do professor) ────────────────────────────────
export type MaterialKind = 'link' | 'file'

export interface Material {
  id: string
  title: string
  kind: MaterialKind
  /** vínculo opcional a uma música (library_entry.id). */
  entryId?: string
  note?: string
  /** MIME (só arquivos) — pra escolher ícone (pdf/imagem/áudio). */
  mime?: string
  source?: string
  givenAt?: string
  createdAt: string
  /** URL pronta pra abrir: link direto, ou signed URL curta (arquivos). */
  openUrl?: string
  /** path no bucket (só arquivos) — necessário pra remover do storage. */
  storagePath?: string
}
