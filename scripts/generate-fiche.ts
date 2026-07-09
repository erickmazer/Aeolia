/**
 * Gerador de ficha por IA (linha de comando)
 * ===========================================
 * Você digita título + artista; a IA preenche a ficha no mesmo schema da
 * biblioteca. Compartilha prompt/schema com a rota do site (fiche-ai.ts) e o
 * cliente de IA (lib/ai/client.ts) — por padrão z.ai/GLM.
 *
 * Rodar:
 *   export ANTHROPIC_API_KEY=<sua-chave-z.ai>   # ou de outro endpoint compatível
 *   bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
 *   FICHE_MODEL=glm-4.5-air bun run scripts/generate-fiche.ts "..." "..."
 */

import { aiClient, generateStructured } from '../lib/ai/client'
import { buildFichePrompt, ficheSchema, FICHE_MODEL, type FicheDraft } from '../lib/library/fiche-ai'

async function main() {
  const [title, artist] = process.argv.slice(2)
  if (!title || !artist) {
    console.error('Uso: bun run scripts/generate-fiche.ts "<título>" "<artista>"')
    process.exit(1)
  }

  const fiche = await generateStructured<FicheDraft>({
    client: aiClient(),
    model: FICHE_MODEL,
    prompt: buildFichePrompt(title, artist),
    schema: ficheSchema,
    toolName: 'salvar_ficha',
    toolDescription: 'Registra a ficha catalográfica da música.',
    maxTokens: 1500,
  })

  const slug = `${title}-${artist}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  console.log(JSON.stringify({ slug, status: 'quero-aprender', ...fiche }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
