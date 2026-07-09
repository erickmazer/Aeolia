// Personalização por IA: fit + dificuldade relativa por música e sugestões de
// próximas. Puro (sem SDK) — a rota /api/personalize monta o cliente e chama.

import { TECHNIQUES, TECHNIQUE_BY_ID, GENRE_TECHS, type Song } from './data'
import type { UserSignal } from './signal'

export type RelativeDifficulty = 'confortavel' | 'um-degrau-acima' | 'desafio' | 'cedo-demais'

export const RELATIVE_DIFFICULTY_LABEL: Record<RelativeDifficulty, string> = {
  confortavel: 'Confortável',
  'um-degrau-acima': 'Um degrau acima',
  desafio: 'Desafio',
  'cedo-demais': 'Cedo demais',
}

/** Fit de uma música com o usuário (por música da biblioteca). */
export interface SongFit {
  songId: string
  relativeDifficulty: RelativeDifficulty
  gosto: number // 0–100
  momento: number // 0–100
  rationale: string
}

/** Sugestão de próxima música (pode estar fora do catálogo). */
export interface Suggestion {
  title: string
  artist: string
  rationale: string
  alvoDificuldade: number // 1–5
}

export interface PersonalizationResult {
  perSong: Record<string, SongFit>
  suggestions: Suggestion[]
}

export const PERSONALIZATION_MODEL = process.env.PERSONALIZATION_MODEL ?? 'glm-4.5-air'

// Schema estruturado. perSong é array (mapa é awkward em json_schema) — a rota
// converte pra Record por songId.
export const personalizationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    perSong: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          songId: { type: 'string' },
          relativeDifficulty: {
            type: 'string',
            enum: ['confortavel', 'um-degrau-acima', 'desafio', 'cedo-demais'],
          },
          gosto: { type: 'integer', minimum: 0, maximum: 100 },
          momento: { type: 'integer', minimum: 0, maximum: 100 },
          rationale: { type: 'string' },
        },
        required: ['songId', 'relativeDifficulty', 'gosto', 'momento', 'rationale'],
      },
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          artist: { type: 'string' },
          rationale: { type: 'string' },
          alvoDificuldade: { type: 'integer', enum: [1, 2, 3, 4, 5] },
        },
        required: ['title', 'artist', 'rationale', 'alvoDificuldade'],
      },
    },
  },
  required: ['perSong', 'suggestions'],
}

function tagList(tags: { id: string; score: number }[], byId: Record<string, { name: string }>): string {
  if (tags.length === 0) return '(nenhum ainda)'
  return tags.map((t) => `${byId[t.id]?.name ?? t.id} (${t.score})`).join(', ')
}

export function buildPersonalizationPrompt(signal: UserSignal, songs: Song[]): string {
  const catalogTec = TECHNIQUES.map((t) => `${t.id}: ${t.name}`).join(', ')

  const lib = songs
    .map(
      (s) =>
        `- id=${s.id} | "${s.title}" — ${s.artist} | dificuldade ${s.difficulty}/5 | status ${s.status} | gênero: ${s.genre ?? '—'} | técnicas: ${s.techniques.join(', ') || '—'}`,
    )
    .join('\n')

  return `Você é um professor de música que personaliza uma biblioteca de estudos de violão.

PERFIL DO ALUNO (derivado da biblioteca):
- Nível estimado: ${signal.nivel}/5 (encarando dificuldade ${signal.encarando}/5).
- Momento: ${signal.momento} (${signal.dominadas} dominadas de ${signal.total}).
- Gosto por técnicas: ${tagList(signal.gostoTecnicas, TECHNIQUE_BY_ID)}.
- Gosto por gêneros: ${signal.gostoGeneros.map((g) => `${g.id} (${g.score})`).join(', ') || '(nenhum ainda)'}.
- Praticando de fato agora: ${signal.praticando.join(', ') || '(sem registro recente)'} — priorize a coerência com o que ele REALMENTE toca.
- Técnicas típicas dos gêneros dele: ${signal.gostoGeneros
    .map((g) => `${g.id} → ${(GENRE_TECHS[g.id] ?? []).map((t) => TECHNIQUE_BY_ID[t]?.name ?? t).join('/') || '—'}`)
    .join('; ') || '—'}.

BIBLIOTECA ATUAL (${songs.length} músicas):
${lib || '(vazia — o aluno está começando)'}

Catálogo de técnicas (ids): ${catalogTec}

TAREFAS:
1) "perSong": para CADA música da biblioteca (use o id exato fornecido), avalie:
   - relativeDifficulty relativa ao NÍVEL do aluno (não à dificuldade absoluta):
     confortavel | um-degrau-acima | desafio | cedo-demais.
   - gosto (0–100): quão alinhada ao gosto dele.
   - momento (0–100): quão adequada ao momento atual da jornada.
   - rationale: 1 frase PT-BR, específica (não genérica).
2) "suggestions": 3 a 5 PRÓXIMAS músicas para aprender a seguir — músicas REAIS
   (podem estar fora da biblioteca/catálogo), coerentes com o nível, o gosto e uma
   progressão natural de dificuldade. Cada uma com title, artist, alvoDificuldade
   (1–5) e rationale (1 frase PT-BR dizendo o que ela desenvolve e por que agora).
   Não repita músicas que já estão na biblioteca.`
}
