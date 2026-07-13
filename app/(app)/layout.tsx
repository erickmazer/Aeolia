import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/library/queries'
import { SignInPanel } from '@/components/library/auth-button'
import { AppShell } from '@/components/app/app-shell'

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-0 flex min-h-screen items-center justify-center bg-[color:var(--color-ink)] px-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <Centered>
        <p className="leading-relaxed text-[color:var(--color-paper)]/85">
          O app precisa do Supabase configurado. Veja{' '}
          <code className="text-[color:var(--color-patina)]">README-biblioteca.md</code>.
        </p>
      </Centered>
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return (
      <Centered>
        <h1 className="mb-2 font-serif text-3xl">Aeolia</h1>
        <p className="mb-6 leading-relaxed text-[color:var(--color-paper)]/85">
          Entre para acessar a sua jornada.
        </p>
        <SignInPanel next="/praticar" />
      </Centered>
    )
  }

  const label =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'você'

  return <AppShell userLabel={label}>{children}</AppShell>
}
