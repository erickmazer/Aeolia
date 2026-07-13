import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/library/queries'
import { Landing } from '@/components/landing'

// Logado → o app pessoal (casca mobile). Anônimo → landing.
export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect('/praticar')
  return <Landing />
}
