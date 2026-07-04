import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

/**
 * Mantém a sessão do Supabase fresca (refresh do cookie de auth) em cada
 * request das rotas que precisam. Chamado pelo proxy.ts.
 *
 * Se o Supabase não estiver configurado, deixa passar (fail open) — assim o
 * resto do site continua funcionando durante o setup.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // IMPORTANTE: não coloque lógica entre createServerClient e getUser().
  await supabase.auth.getUser()

  return response
}
