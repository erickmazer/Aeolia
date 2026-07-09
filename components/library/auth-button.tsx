'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const linkClass =
  'text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]'
const inputClass =
  'rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]'
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

/** Login por e-mail (magic link) — nativo do Supabase, sem configurar provider. */
function EmailSignIn({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('sending')
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setState('error')
      setMsg(error.message)
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <p className="text-sm leading-relaxed text-[color:var(--color-paper)]/85">
        Enviei um link de acesso para <span className="text-[color:var(--color-patina)]">{email}</span>. Abra o
        e-mail (no mesmo navegador) para entrar.
      </p>
    )
  }

  return (
    <form onSubmit={send} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        required
        className={inputClass}
        style={borderStyle}
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] transition-opacity disabled:opacity-40"
        style={{ background: 'var(--color-patina)' }}
      >
        {state === 'sending' ? 'enviando…' : 'enviar link'}
      </button>
      {state === 'error' && <span className="w-full text-sm text-[color:oklch(0.65_0.15_25)]">{msg}</span>}
    </form>
  )
}

/**
 * Login: Google (primário) + e-mail/magic link (secundário, discreto).
 * Google requer o provider habilitado no Supabase (Authentication → Providers).
 * O e-mail é zero-config (nativo) — funciona como fallback mesmo sem o Google.
 */
export function SignInPanel({ next = '/studio' }: { next?: string }) {
  const [emailOpen, setEmailOpen] = useState(false)

  async function signInGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signInGoogle}
        className="rounded-md px-6 py-2.5 text-sm text-[color:var(--color-ink)] transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-patina)' }}
      >
        Entrar com Google
      </button>

      {emailOpen ? (
        <EmailSignIn next={next} />
      ) : (
        <p className="text-sm text-[color:var(--color-ash)]">
          ou{' '}
          <button type="button" onClick={() => setEmailOpen(true)} className={linkClass}>
            entrar por e-mail
          </button>
        </p>
      )}
    </div>
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
