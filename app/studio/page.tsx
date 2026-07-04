import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCurrentUser, getMySongs } from '@/lib/library/queries'
import { PersonalLibrary } from '@/components/library/personal-library'
import { SignInPanel, SignOutButton } from '@/components/library/auth-button'

export const metadata = {
  title: 'Minha Biblioteca',
  description: 'Sua biblioteca pessoal de estudos de violão.',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-0 min-h-screen bg-[color:var(--color-ink)] px-8 py-16 sm:px-12 md:px-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/musician/erick"
          className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
        >
          ← vitrine
        </Link>
        {children}
      </div>
    </div>
  )
}

export default async function StudioPage() {
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <p className="mt-16 max-w-prose leading-relaxed text-[color:var(--color-paper)]/85">
          A biblioteca pessoal ainda não está configurada (falta o Supabase). Veja{' '}
          <code className="text-[color:var(--color-patina)]">README-biblioteca.md</code> para o setup.
        </p>
      </Shell>
    )
  }

  const user = await getCurrentUser()

  if (!user) {
    return (
      <Shell>
        <header className="mb-12 mt-16">
          <h1 className="mb-4 font-serif text-3xl leading-tight [text-box:trim-start_cap_alphabetic]">Minha Biblioteca</h1>
          <p className="mb-6 max-w-prose leading-relaxed text-[color:var(--color-paper)]/85">
            Entre para montar e acompanhar a sua própria biblioteca do violonista — com fichas
            geradas por IA, técnicas, contextos e a sua árvore de evolução.
          </p>
          <SignInPanel />
        </header>
      </Shell>
    )
  }

  const songs = (await getMySongs()) ?? []
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email

  return (
    <Shell>
      <header className="mb-12 mt-16">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl leading-tight [text-box:trim-start_cap_alphabetic]">Minha Biblioteca</h1>
          <span className="text-sm text-[color:var(--color-ash)]">
            {name} · <SignOutButton />
          </span>
        </div>
        <p className="max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
          Digite título + artista, a IA preenche a ficha, você revisa e salva. Um projeto vivo — atualize
          conforme sua evolução.
        </p>
      </header>

      <PersonalLibrary initialSongs={songs} />
    </Shell>
  )
}
