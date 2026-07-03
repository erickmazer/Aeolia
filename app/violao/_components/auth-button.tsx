'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const linkClass =
  'text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]'
const inputClass =
  'rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)]'
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const

/** Login por e-mail (magic link) — nativo do Supabase, sem configurar provider. */
export function EmailSignIn({ next = '/violao/minha' }: { next?: string }) {
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
        {state === 'sending' ? 'enviando…' : 'enviar link de acesso'}
      </button>
      {state === 'error' && <span className="w-full text-sm text-[color:oklch(0.65_0.15_25)]">{msg}</span>}
    </form>
  )
}

/** Login com Google (só funciona depois de configurar o provider no Supabase). */
export function SignInButton({ next = '/violao/minha', label = 'Entrar com Google' }: { next?: string; label?: string }) {
  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }
  return (
    <button type="button" onClick={signIn} className={linkClass}>
      {label}
    </button>
  )
}

/** Painel completo: e-mail (padrão) + Google (opcional). */
export function SignInPanel({ next = '/violao/minha' }: { next?: string }) {
  return (
    <div className="space-y-3">
      <EmailSignIn next={next} />
      <p className="text-sm text-[color:var(--color-ash)]">
        ou <SignInButton next={next} label="entrar com Google" />
      </p>
    </div>
  )
}

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/violao'
  }
  return (
    <button type="button" onClick={signOut} className={linkClass}>
      sair
    </button>
  )
}
