'use client'

import { createClient } from '@/lib/supabase/client'

const linkClass =
  'text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]'

/**
 * Login com Google (OAuth via Supabase).
 * Requer o provider Google habilitado no Supabase (Authentication → Providers).
 */
export function SignInPanel({ next = '/studio' }: { next?: string }) {
  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  return (
    <button
      type="button"
      onClick={signIn}
      className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm text-[color:var(--color-ink)] transition-opacity hover:opacity-90"
      style={{ background: 'var(--color-patina)' }}
    >
      {/* logotipo G simplificado (SVG inline) */}
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
        <path fill="#1c1a17" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" opacity=".0"/>
      </svg>
      Entrar com Google
    </button>
  )
}

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/musician/erick'
  }
  return (
    <button type="button" onClick={signOut} className={linkClass}>
      sair
    </button>
  )
}
