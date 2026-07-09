// Prompt + schema estruturado do gerador de ficha por IA.
// Puro (sem importar o SDK da Anthropic), então serve tanto pra rota de
// servidor quanto pro script de linha de comando.

import { TECHNIQUES, GENRES, DIFFICULTY_LABELS, TECHNIQUE_IDS } from './data'

/** A ficha que a IA preenche — só a parte "rica"; status/id/relações são do usuário. */
export interface FicheDraft {
  title: string
  artist: string
  difficulty: 1 | 2 | 3 | 4 | 5
  techniques: string[]
  genre: string
  bestVersion?: { label: string; url: string }
  bestLesson?: { label: string; url: string }
  notes: string
}

// Schema estruturado: a resposta é garantidamente uma ficha válida. Os enums
// travam técnicas/contextos aos ids que existem no catálogo — malformado é
// impossível.
export const ficheSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    artist: { type: 'string' },
    difficulty: { type: 'integer', enum: [1, 2, 3, 4, 5] },
    techniques: { type: 'array', items: { type: 'string', enum: TECHNIQUE_IDS } },
    genre: { type: 'string', enum: GENRES },
    bestVersion: {
      type: 'object',
      additionalProperties: false,
      properties: { label: { type: 'string' }, url: { type: 'string' } },
      required: ['label', 'url'],
    },
    bestLesson: {
      type: 'object',
      additionalProperties: false,
      properties: { label: { type: 'string' }, url: { type: 'string' } },
      required: ['label', 'url'],
    },
    notes: { type: 'string' },
  },
  required: ['title', 'artist', 'difficulty', 'techniques', 'genre', 'notes'],
}

const techniqueGuide = TECHNIQUES.map((t) => `- ${t.id}: ${t.name} — ${t.blurb}`).join('\n')
const genreGuide = GENRES.join(', ')
const difficultyGuide = Object.entries(DIFFICULTY_LABELS)
  .map(([n, label]) => `${n} = ${label}`)
  .join(', ')

export function buildFichePrompt(title: string, artist: string): string {
  return `Você cataloga músicas para uma biblioteca pessoal de estudos de violão.
Preencha a ficha da música "${title}" — ${artist}.

Técnicas disponíveis (use os ids):
${techniqueGuide}

Gêneros disponíveis (escolha UM, o mais central):
${genreGuide}

Dificuldade: ${difficultyGuide} (do ponto de vista de um violonista intermediário
tocando dedilhado/fingerstyle e cantando junto).

Regras:
- Escolha só as técnicas REALMENTE centrais para esta música, e UM gênero.
- "notes" (2-3 frases, PT-BR): o que essa música ensina e onde mora a dificuldade.
  Escreva como um professor experiente, não genérico.
- Em bestVersion/bestLesson, se não souber um link específico e confiável, use uma
  URL de busca no YouTube (https://www.youtube.com/results?search_query=...). Não invente
  links de vídeos específicos.`
}

/** Modelo padrão do gerador (troque via FICHE_MODEL). GLM barato por padrão. */
export const FICHE_MODEL = process.env.FICHE_MODEL ?? 'glm-4.5-air'
