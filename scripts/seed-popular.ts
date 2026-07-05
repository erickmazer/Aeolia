/**
 * Pré-popula o catálogo canônico com músicas populares e faz uma AUDITORIA de
 * schema (que campos faltam / sobram) — gerando as fichas pela mesma IA do site.
 *
 * Dois objetivos:
 *  1. Popular canonical_songs → novos usuários caem em dedup (add sem IA).
 *  2. Estressar o schema: ver quais técnicas/contextos nunca são usados e onde a
 *     IA "chuta" (sinal de campo faltando).
 *
 * Uso:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   bun run scripts/seed-popular.ts               # DRY-RUN: gera + relatório em JSON, NÃO grava
 *   # para gravar no banco (precisa do Supabase):
 *   export NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=eyJ...       # NUNCA commite/exponha
 *   bun run scripts/seed-popular.ts --commit
 */

import { writeFileSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { buildFichePrompt, ficheSchema, FICHE_MODEL, type FicheDraft } from '../lib/library/fiche-ai'
import { TECHNIQUE_IDS, CONTEXT_IDS } from '../lib/library/data'

// Lista curada de músicas populares (violão/fingerstyle + pop/MPB/rock).
// Expanda à vontade — é a semente do catálogo comunitário.
const POPULAR: Array<[string, string]> = [
  ['Wonderwall', 'Oasis'],
  ['Tears in Heaven', 'Eric Clapton'],
  ['Hotel California', 'Eagles'],
  ['Blackbird', 'The Beatles'],
  ['Here Comes the Sun', 'The Beatles'],
  ['Let It Be', 'The Beatles'],
  ['Yesterday', 'The Beatles'],
  ['Dust in the Wind', 'Kansas'],
  ['Nothing Else Matters', 'Metallica'],
  ['Stairway to Heaven', 'Led Zeppelin'],
  ['More Than Words', 'Extreme'],
  ['Fast Car', 'Tracy Chapman'],
  ['Wish You Were Here', 'Pink Floyd'],
  ['Knockin\' on Heaven\'s Door', 'Bob Dylan'],
  ['Hallelujah', 'Leonard Cohen'],
  ['Everybody Hurts', 'R.E.M.'],
  ['Redemption Song', 'Bob Marley'],
  ['Creep', 'Radiohead'],
  ['The Sound of Silence', 'Simon & Garfunkel'],
  ['Riptide', 'Vance Joy'],
  ['Ho Hey', 'The Lumineers'],
  ['I\'m Yours', 'Jason Mraz'],
  ['Hey There Delilah', 'Plain White T\'s'],
  ['Perfect', 'Ed Sheeran'],
  ['Thinking Out Loud', 'Ed Sheeran'],
  ['Photograph', 'Ed Sheeran'],
  ['Someone Like You', 'Adele'],
  ['Let Her Go', 'Passenger'],
  ['Chasing Cars', 'Snow Patrol'],
  ['Sunday Morning', 'Maroon 5'],
  ['Have You Ever Seen the Rain', 'Creedence Clearwater Revival'],
  ['Imagine', 'John Lennon'],
  ['Classical Gas', 'Mason Williams'],
  ['Cavatina', 'Stanley Myers'],
  ['Drifting', 'Andy McKee'],
  ['Trem-Bala', 'Ana Vilela'],
  ['Asa Branca', 'Luiz Gonzaga'],
  ['Você é Linda', 'Caetano Veloso'],
  ['Garota de Ipanema', 'Tom Jobim'],
  ['Wave', 'Tom Jobim'],
  ['Aquarela', 'Toquinho'],
  ['Eu Sei Que Vou Te Amar', 'Tom Jobim'],
  ['Sozinho', 'Caetano Veloso'],
  ['Trevo (Tu)', 'Anavitória'],
  ['Evidências', 'Chitãozinho & Xororó'],
  ['Wonderful Tonight', 'Eric Clapton'],
  ['Layla (Unplugged)', 'Eric Clapton'],
  ['Time in a Bottle', 'Jim Croce'],
  ['Landslide', 'Fleetwood Mac'],
  ['Never Going Back Again', 'Fleetwood Mac'],
]

const COMMIT = process.argv.includes('--commit')

async function generateFiche(client: Anthropic, title: string, artist: string): Promise<FicheDraft> {
  const response = await client.messages.create({
    model: FICHE_MODEL,
    max_tokens: 1500,
    output_config: { format: { type: 'json_schema', schema: ficheSchema } },
    messages: [{ role: 'user', content: buildFichePrompt(title, artist) }],
  })
  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') throw new Error(`sem resposta p/ ${title}`)
  return JSON.parse(block.text) as FicheDraft
}

// Pool de concorrência simples.
async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
  return out
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Falta ANTHROPIC_API_KEY.')
    process.exit(1)
  }
  const client = new Anthropic()

  console.log(`Gerando ${POPULAR.length} fichas (modelo ${FICHE_MODEL})…`)
  const results = await mapPool(POPULAR, 4, async ([title, artist]) => {
    try {
      const fiche = await generateFiche(client, title, artist)
      process.stdout.write('.')
      return { ok: true as const, title, artist, fiche }
    } catch (e) {
      process.stdout.write('x')
      return { ok: false as const, title, artist, error: e instanceof Error ? e.message : String(e) }
    }
  })
  console.log('')

  const good = results.filter((r) => r.ok) as Array<{ ok: true; title: string; artist: string; fiche: FicheDraft }>
  const bad = results.filter((r) => !r.ok)

  // ── Auditoria de schema ─────────────────────────────────────────────────
  const tecUse = new Map<string, number>(TECHNIQUE_IDS.map((id) => [id, 0]))
  const ctxUse = new Map<string, number>(CONTEXT_IDS.map((id) => [id, 0]))
  let emptyTec = 0
  let emptyCtx = 0
  for (const r of good) {
    if (!r.fiche.techniques?.length) emptyTec++
    if (!r.fiche.contexts?.length) emptyCtx++
    for (const t of r.fiche.techniques ?? []) tecUse.set(t, (tecUse.get(t) ?? 0) + 1)
    for (const c of r.fiche.contexts ?? []) ctxUse.set(c, (ctxUse.get(c) ?? 0) + 1)
  }
  const neverTec = [...tecUse].filter(([, n]) => n === 0).map(([id]) => id)
  const neverCtx = [...ctxUse].filter(([, n]) => n === 0).map(([id]) => id)

  console.log('\n=== AUDITORIA DE SCHEMA ===')
  console.log(`Geradas: ${good.length}/${POPULAR.length} (falhas: ${bad.length})`)
  console.log('Uso de técnicas:', Object.fromEntries(tecUse))
  console.log('Uso de contextos:', Object.fromEntries(ctxUse))
  if (neverTec.length) console.log('⚠️ Técnicas NUNCA usadas (candidatas a remover):', neverTec.join(', '))
  if (neverCtx.length) console.log('⚠️ Contextos NUNCA usados (candidatos a remover):', neverCtx.join(', '))
  console.log(`⚠️ Fichas sem técnica: ${emptyTec} · sem contexto: ${emptyCtx} (alto = falta granularidade/campo)`)
  if (bad.length) console.log('Falhas:', bad.map((b) => `${b.title} — ${b.artist}`).join('; '))
  console.log('Dica: campos que a taxonomia atual não captura (tom, afinação, capo, BPM, acordes, ano) aparecem como "chute" nas notes.')

  if (!COMMIT) {
    const path = '/tmp/aeolia-seed-popular.json'
    writeFileSync(path, JSON.stringify(good.map((g) => g.fiche), null, 2))
    console.log(`\nDRY-RUN: nada gravado no banco. Fichas salvas em ${path}. Use --commit para inserir.`)
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('\n--commit precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  let inserted = 0
  for (const g of good) {
    const { error } = await db.from('canonical_songs').upsert(
      {
        title: g.fiche.title,
        artist: g.fiche.artist,
        difficulty: g.fiche.difficulty,
        techniques: g.fiche.techniques,
        contexts: g.fiche.contexts,
        best_version_label: g.fiche.bestVersion?.label ?? null,
        best_version_url: g.fiche.bestVersion?.url ?? null,
        best_lesson_label: g.fiche.bestLesson?.label ?? null,
        best_lesson_url: g.fiche.bestLesson?.url ?? null,
        notes: g.fiche.notes ?? null,
        verified: true,
      },
      { onConflict: 'dedup_key' },
    )
    if (error) console.error(`falha ao gravar ${g.title}:`, error.message)
    else inserted++
  }
  console.log(`\nGravadas/atualizadas ${inserted} músicas canônicas.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
