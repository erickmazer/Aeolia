import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Só chame quando `isSupabaseConfigured` for verdadeiro.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Chamado de um Server Component (cookies read-only). O refresh de
          // sessão é feito no proxy.ts, então isto é seguro de ignorar.
        }
      },
    },
  })
}
