import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/library/queries'

// Logado → o app pessoal (casca mobile). Anônimo → a vitrine pública zen.
export default async function Home() {
  const user = await getCurrentUser()
  redirect(user ? '/today' : '/musician/erick')
}
