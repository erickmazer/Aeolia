import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

// Finaliza o login e redireciona pro app. Cobre os dois fluxos:
//  - OAuth / PKCE (Google): ?code=...  → exchangeCodeForSession
//  - Magic link (e-mail):   ?token_hash=...&type=email → verifyOtp
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/today'
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Base do redirect: atrás do proxy da Vercel, `origin` de request.url é o host
  // CANÔNICO de produção — não o alias do preview. Isso jogava o login de qualquer
  // preview de volta pra produção. Preferimos o host encaminhado (x-forwarded-host),
  // caindo pra `origin` no dev local (onde o header não existe). Padrão documentado
  // pelo Supabase pra OAuth atrás de load balancer/proxy.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const base = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

  if (isSupabaseConfigured) {
    const supabase = await createClient()

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(`${base}${next}`)
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      if (!error) return NextResponse.redirect(`${base}${next}`)
    }
  }

  return NextResponse.redirect(`${base}/today?erro=auth`)
}
