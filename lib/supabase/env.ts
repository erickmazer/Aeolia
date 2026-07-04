// Leitura central das variáveis de ambiente do Supabase.
// Tudo é opcional em build-time: enquanto não configurado, a página pública
// cai num fallback pra semente curada (nada regride durante o setup).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
