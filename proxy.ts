import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * Edge proxy (Next 16 renamed the `middleware` convention to `proxy`).
 *
 * Mantém o cookie de sessão do Supabase fresco nas rotas do app (fail open:
 * sem Supabase configurado, deixa passar). Só afeta as páginas renderizadas.
 */
export async function proxy(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: ['/', '/musician/:path*', '/studio', '/today', '/songs', '/exercises', '/practice', '/practice/:path*', '/auth/:path*', '/api/:path*'],
}
