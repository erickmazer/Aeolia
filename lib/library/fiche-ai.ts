// Prompt + schema estruturado do gerador de ficha por IA.
// Puro (sem importar o SDK da Anthropic), então serve tanto pra rota de
// servidor quanto pro script de linha de comando.

import { TECHNIQUES, CONTEXTS, DIFFICULTY_LABELS, TECHNIQUE_IDS, CONTEXT_IDS } from './data'

/** A ficha que a IA preenche — só a parte "rica"; status/id/relações são do usuário. */
export interface FicheDraft {
  title: string
  artist: string
  difficulty: 1 | 2 | 3 | 4 | 5
  techniques: string[]
  contexts: string[]
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
    contexts: { type: 'array', items: { type: 'string', enum: CONTEXT_IDS } },
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
  required: ['title', 'artist', 'difficulty', 'techniques', 'contexts', 'notes'],
}

const techniqueGuide = TECHNIQUES.map((t) => `- ${t.id}: ${t.name} — ${t.blurb}`).join('\n')
const contextGuide = CONTEXTS.map((c) => `- ${c.id}: ${c.name} — ${c.blurb}`).join('\n')
const difficultyGuide = Object.entries(DIFFICULTY_LABELS)
  .map(([n, label]) => `${n} = ${label}`)
  .join(', ')

export function buildFichePrompt(title: string, artist: string): string {
  return `Você cataloga músicas para uma biblioteca pessoal de estudos de violão.
Preencha a ficha da música "${title}" — ${artist}.

Técnicas disponíveis (use os ids):
${techniqueGuide}

Contextos disponíveis (use os ids):
${contextGuide}

Dificuldade: ${difficultyGuide} (do ponto de vista de um violonista intermediário
tocando dedilhado/fingerstyle e cantando junto).

Regras:
- Escolha só as técnicas e contextos REALMENTE centrais para esta música.
- "notes" (2-3 frases, PT-BR): o que essa música ensina e onde mora a dificuldade.
  Escreva como um professor experiente, não genérico.
- Em bestVersion/bestLesson, se não souber um link específico e confiável, use uma
  URL de busca no YouTube (https://www.youtube.com/results?search_query=...). Não invente
  links de vídeos específicos.`
}

/** Modelo padrão do gerador (troque via FICHE_MODEL). */
export const FICHE_MODEL = process.env.FICHE_MODEL ?? 'claude-sonnet-5'
