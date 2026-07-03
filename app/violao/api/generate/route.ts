import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { buildFichePrompt, ficheSchema, FICHE_MODEL } from '../../_lib/fiche-ai'

export const runtime = 'nodejs'

/**
 * Gera a ficha de uma música por IA. Protegida: só usuários autenticados.
 * NÃO salva — devolve o rascunho pro cliente revisar e então inserir.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para gerar fichas.' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' }, { status: 503 })
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string; artist?: string }
  const title = body.title?.trim()
  const artist = body.artist?.trim()
  if (!title || !artist) {
    return NextResponse.json({ error: 'Informe título e artista.' }, { status: 400 })
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: FICHE_MODEL,
      max_tokens: 1500,
      output_config: { format: { type: 'json_schema', schema: ficheSchema } },
      messages: [{ role: 'user', content: buildFichePrompt(title, artist) }],
    })

    const block = response.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: 'O modelo não retornou uma ficha.' }, { status: 502 })
    }
    return NextResponse.json(JSON.parse(block.text))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha ao gerar a ficha.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
