/**
 * Gerador de ficha por IA (linha de comando)
 * ===========================================
 * Você digita título + artista; o Claude preenche a ficha no mesmo schema da
 * biblioteca. Compartilha o prompt/schema com a rota do site (fiche-ai.ts).
 *
 * Rodar:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
 *   VIOLAO_FICHE_MODEL=claude-haiku-4-5 bun run scripts/generate-fiche.ts "..." "..."
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildFichePrompt, ficheSchema, FICHE_MODEL, type FicheDraft } from '../app/violao/_lib/fiche-ai'

async function main() {
  const [title, artist] = process.argv.slice(2)
  if (!title || !artist) {
    console.error('Uso: bun run scripts/generate-fiche.ts "<título>" "<artista>"')
    process.exit(1)
  }

  const client = new Anthropic() // usa ANTHROPIC_API_KEY do ambiente

  const response = await client.messages.create({
    model: FICHE_MODEL,
    max_tokens: 1500,
    output_config: { format: { type: 'json_schema', schema: ficheSchema } },
    messages: [{ role: 'user', content: buildFichePrompt(title, artist) }],
  })

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') throw new Error('Sem resposta de texto do modelo')

  const fiche = JSON.parse(block.text) as FicheDraft
  const slug = `${title}-${artist}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  console.log(JSON.stringify({ slug, status: 'quero-aprender', ...fiche }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
