'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/today', label: 'Today', id: 'today' },
  { href: '/songs', label: 'Songs', id: 'songs' },
  { href: '/practice', label: 'Practice', id: 'practice' },
  { href: '/exercises', label: 'Exercises', id: 'exercises' },
] as const

// Ícones da bottom bar — linha fina, herdam a cor do link (currentColor).
function NavIcon({ id }: { id: (typeof TABS)[number]['id'] }) {
  if (id === 'today') {
    // sol / "hoje"
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>
    )
  }
  if (id === 'songs') {
    // nota musical / repertório
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 18V6l10-2v10" />
        <circle cx="6.5" cy="18" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="16" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (id === 'practice') {
    // play / modo prática
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="8 5 19 12 8 19" />
      </svg>
    )
  }
  // barras / exercícios (drills)
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 20V10M12 20V4M18 20v-7" />
    </svg>
  )
}

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
      {/* Header — fixo no topo (avatar + engrenagem) */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 pb-3 pt-6"
        style={{
          background: 'var(--color-ink)',
          borderBottom: '1px solid color-mix(in oklch, var(--color-ash) 18%, transparent)',
        }}
      >
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
              <NavIcon id={t.id} />
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
