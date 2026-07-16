'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Wordmark } from '@/components/brand/wordmark'
import { EmailSignIn, signInWithGoogle } from '@/components/library/auth-button'
import { Spinner } from '@/components/app/spinner'

const NEXT = '/praticar'

const linkClass =
  'text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]'

export interface LoginUser {
  name: string
  email: string
  avatarUrl: string | null
}

/**
 * Tela única de login (a primeira página). Funde a antiga landing + o gate de
 * login numa só, com o Google upfront. Se já há sessão, mostra "Continuar como
 * <nome>" num toque. `initialUser` vem do server (sem flash); reforça com
 * getSession() no cliente (cookie do @supabase/ssr, sem round-trip).
 */
export function LoginScreen({ initialUser }: { initialUser: LoginUser | null }) {
  const router = useRouter()
  const [user, setUser] = useState<LoginUser | null>(initialUser)
  const [emailOpen, setEmailOpen] = useState(false)
  const [going, setGoing] = useState(false)

  // Reforço client-side: se o server não pegou o usuário mas há sessão no
  // cookie, ainda oferece o one-tap.
  useEffect(() => {
    if (initialUser || !isSupabaseConfigured) return
    let alive = true
    try {
      createClient()
        .auth.getSession()
        .then(({ data }) => {
          const u = data.session?.user
          if (!alive || !u) return
          const meta = u.user_metadata ?? {}
          setUser({
            name: (meta.full_name as string) ?? (meta.name as string) ?? u.email ?? 'você',
            email: u.email ?? '',
            avatarUrl: (meta.avatar_url as string) ?? null,
          })
        })
        .catch(() => {})
    } catch {
      // Supabase indisponível — segue no estado deslogado.
    }
    return () => {
      alive = false
    }
  }, [initialUser])

  function continueIn() {
    setGoing(true)
    router.push(NEXT)
  }

  return (
    <div className="relative z-0 flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-ink)] px-6 text-center">
      <div className="aeolia-rise mx-auto w-full max-w-sm">
        <h1 className="text-5xl leading-none text-[color:var(--color-paper)]">
          <Wordmark ligature />
        </h1>

        {user ? (
          // ── Já autenticado: continuar num toque ──────────────────────────
          <>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-ash)]">Bom te ver de volta.</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={continueIn}
                disabled={going}
                className="flex w-full items-center justify-center gap-3 rounded-full py-2.5 pl-2.5 pr-5 text-sm text-[color:var(--color-ink)] transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'var(--color-patina)' }}
              >
                <Avatar user={user} />
                {going ? <Spinner /> : <span className="truncate">Continuar como {user.name}</span>}
              </button>
              <button type="button" onClick={() => signInWithGoogle(NEXT)} className={linkClass}>
                entrar com outra conta
              </button>
            </div>
          </>
        ) : (
          // ── Deslogado: Google upfront + e-mail (toggle) ──────────────────
          <>
            <p className="mt-4 leading-relaxed text-[color:var(--color-paper)]/85">
              Sua jornada no violão — repertório, técnicas e progresso, num mapa da sua evolução.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => signInWithGoogle(NEXT)}
                className="w-full rounded-full py-2.5 text-sm text-[color:var(--color-ink)] transition-transform active:scale-[0.98]"
                style={{ background: 'var(--color-patina)' }}
              >
                Entrar com Google
              </button>

              {emailOpen ? (
                <EmailSignIn next={NEXT} />
              ) : (
                <p className="text-sm text-[color:var(--color-ash)]">
                  ou{' '}
                  <button type="button" onClick={() => setEmailOpen(true)} className={linkClass}>
                    entrar por e-mail
                  </button>
                </p>
              )}

              <Link href="/musician/erick" className={`${linkClass} mt-2`}>
                ver uma biblioteca de exemplo →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Avatar({ user }: { user: LoginUser }) {
  const initial = (user.name.trim()[0] ?? 'A').toUpperCase()
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
    )
  }
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
      style={{ background: 'color-mix(in oklch, var(--color-ink) 30%, transparent)', color: 'var(--color-paper)' }}
      aria-hidden
    >
      {initial}
    </span>
  )
}
