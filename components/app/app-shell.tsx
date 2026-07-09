'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/today', label: 'Today' },
  { href: '/songs', label: 'Songs' },
  { href: '/exercises', label: 'Exercises' },
]

export function AppShell({ userLabel, children }: { userLabel: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const initial = (userLabel.trim()[0] ?? 'A').toUpperCase()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/musician/erick'
  }

  return (
    <div className="relative z-0 mx-auto flex min-h-screen max-w-[480px] flex-col bg-[color:var(--color-ink)]">
      {/* Header — avatar (progresso, em breve) + engrenagem (conta) */}
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm"
          style={{
            color: 'var(--color-ink)',
            background: 'var(--color-patina)',
          }}
          title={userLabel}
          aria-label={`Perfil de ${userLabel}`}
        >
          {initial}
        </div>
        <button
          type="button"
          onClick={signOut}
          aria-label="Conta / sair"
          className="text-lg text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
        >
          ⚙
        </button>
      </header>

      {/* Conteúdo (espaço pra bottom bar) */}
      <main className="flex-1 px-5 pb-28">{children}</main>

      {/* Bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] justify-around border-t px-2 pb-6 pt-3"
        style={{
          background: 'color-mix(in oklch, var(--color-ink) 92%, var(--color-paper))',
          borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)',
        }}
      >
        {TABS.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center gap-1 text-xs tracking-wide transition-colors"
              style={{ color: active ? 'var(--color-patina)' : 'var(--color-ash)' }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active ? 'var(--color-patina)' : 'transparent' }}
              />
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
