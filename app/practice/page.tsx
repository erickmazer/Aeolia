import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCurrentUser, getMySongs, getPracticeSummary } from '@/lib/library/queries'
import { SignInPanel } from '@/components/library/auth-button'
import { PracticeMode } from '@/components/library/practice-mode'

export const metadata = {
  title: 'Practice',
  description: 'Focused practice mode — work through the parts you have not mastered yet.',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-0 min-h-screen bg-[color:var(--color-ink)] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}

export default async function PracticePage() {
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <p className="mt-10 leading-relaxed text-[color:var(--color-paper)]/85">
          O modo de prática precisa do Supabase configurado. Veja{' '}
          <code className="text-[color:var(--color-patina)]">README-biblioteca.md</code>.
        </p>
      </Shell>
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return (
      <Shell>
        <h1 className="mb-4 mt-10 font-serif text-3xl">Practice</h1>
        <p className="mb-6 max-w-prose leading-relaxed text-[color:var(--color-paper)]/85">
          Entre para praticar a sua biblioteca — foque nas partes que ainda não dominou.
        </p>
        <SignInPanel next="/practice" />
      </Shell>
    )
  }

  const [songs, summary] = await Promise.all([getMySongs(), getPracticeSummary()])
  return (
    <Shell>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-serif text-2xl">Practice</h1>
        <Link
          href="/studio"
          className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
        >
          Studio →
        </Link>
      </div>
      <PracticeMode initialSongs={songs ?? []} summary={summary} />
    </Shell>
  )
}
