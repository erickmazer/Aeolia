// Cliente de IA (server-only) — provider-agnóstico.
//
// O projeto fala com a API no formato Anthropic (Messages API), mas por enquanto
// aponta para o endpoint compatível da z.ai (GLM) — mais barato para testar.
// Basta o SDK oficial da Anthropic com o baseURL trocado; a chave vem do ambiente.
//
// Para voltar aos modelos da Anthropic: ANTHROPIC_BASE_URL=https://api.anthropic.com
// + um modelo Anthropic em FICHE_MODEL/PERSONALIZATION_MODEL.

import Anthropic from '@anthropic-ai/sdk'

/** Endpoint da API (formato Anthropic). Default: z.ai/GLM. */
export const AI_BASE_URL = process.env.ANTHROPIC_BASE_URL ?? 'https://api.z.ai/api/anthropic'

/** Modelo GLM barato como padrão; troque por FICHE_MODEL/PERSONALIZATION_MODEL. */
export const DEFAULT_MODEL = 'glm-4.5-air'

/** true se há chave configurada (a rota decide o 503 com mensagem amigável). */
export const isAIConfigured = !!process.env.ANTHROPIC_API_KEY

/** Cliente do SDK apontando para o baseURL escolhido (chave lida do ambiente). */
export function aiClient(): Anthropic {
  return new Anthropic({ baseURL: AI_BASE_URL })
}

interface StructuredArgs {
  client: Anthropic
  model: string
  prompt: string
  /** JSON Schema do resultado (o mesmo que era usado no output_config). */
  schema: unknown
  /** Nome da "ferramenta" que devolve a estrutura. */
  toolName: string
  toolDescription?: string
  maxTokens: number
}

/**
 * Saída estruturada portável: em vez de `output_config.format` (específico da
 * Anthropic e não suportado pela z.ai), define UMA ferramenta com o schema e
 * força `tool_choice`. O `input` da tool_use já vem como objeto validado —
 * funciona tanto na z.ai/GLM quanto na Anthropic.
 */
export async function generateStructured<T>({
  client,
  model,
  prompt,
  schema,
  toolName,
  toolDescription,
  maxTokens,
}: StructuredArgs): Promise<T> {
  const tool = {
    name: toolName,
    description: toolDescription ?? 'Devolve o resultado no formato estruturado pedido.',
    input_schema: schema,
  } as Anthropic.Tool

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    tools: [tool],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    throw new Error('O modelo não retornou a estrutura esperada.')
  }
  return block.input as T
}
