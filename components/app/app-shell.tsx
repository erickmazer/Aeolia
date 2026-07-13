'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ToolsSheet } from '@/components/tools/tools-sheet'

const TABS = [
  { href: '/praticar', label: 'Praticar', id: 'praticar' },
  { href: '/biblioteca', label: 'Biblioteca', id: 'biblioteca' },
  { href: '/voce', label: 'Você', id: 'voce' },
] as const

// Ícones da bottom bar — linha fina, herdam a cor do link (currentColor).
function NavIcon({ id }: { id: (typeof TABS)[number]['id'] }) {
  if (id === 'praticar') {
    // play / praticar (prática + trilha)
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="8 5 19 12 8 19" />
      </svg>
    )
  }
  if (id === 'biblioteca') {
    // livro / acervo (músicas + materiais)
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" />
        <path d="M5 4v16" />
      </svg>
    )
  }
  // pessoa / você (progresso + conta)
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

export function AppShell({ userLabel, children }: { userLabel: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const initial = (userLabel.trim()[0] ?? 'A').toUpperCase()
  const [toolsOpen, setToolsOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/musician/erick'
  }

  return (
    <div className="relative z-0 mx-auto flex min-h-screen max-w-[480px] flex-col bg-[color:var(--color-ink)]">
      {/* Header — fixo no topo (avatar + engrenagem). `fixed` (não sticky) porque
          a cadeia flex de layout quebra o sticky; espelha a bottom bar. */}
      <header
        className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[480px] items-center justify-between px-5 pb-3 pt-6"
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            aria-label="Ferramentas (metrônomo e afinador)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
          >
            {/* diapasão / afinar */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 3v9a4 4 0 0 0 8 0V3" />
              <path d="M12 16v5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={signOut}
            aria-label="Conta / sair"
            className="flex h-9 w-9 items-center justify-center text-lg text-[color:var(--color-ash)] transition-colors hover:text-[color:var(--color-paper)]"
          >
            ⚙
          </button>
        </div>
      </header>

      <ToolsSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />

      {/* Conteúdo — pt- limpa o header fixo (~72px); pb- limpa a bottom bar */}
      <main className="flex-1 px-5 pb-28 pt-20">{children}</main>

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
