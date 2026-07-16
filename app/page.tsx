import { getCurrentUser } from '@/lib/library/queries'
import { LoginScreen, type LoginUser } from '@/components/app/login-screen'

// Primeira página = login enxuto. Logado → mostra "Continuar como <nome>" (1
// toque); anônimo → Google upfront + e-mail. (Antes: landing separada + gate.)
export default async function Home() {
  const user = await getCurrentUser()
  const initialUser: LoginUser | null = user
    ? {
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email ??
          'você',
        email: user.email ?? '',
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      }
    : null
  return <LoginScreen initialUser={initialUser} />
}
