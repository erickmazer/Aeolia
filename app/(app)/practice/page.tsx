import { getMySongs, getPracticeSummary } from '@/lib/library/queries'
import { PracticeMode } from '@/components/library/practice-mode'

export const metadata = { title: 'Practice' }

// Dentro da casca do app (AppShell): herda header fixo + bottom bar.
// A autenticação é feita no layout de (app); aqui é só o conteúdo.
export default async function PracticePage() {
  const [songs, summary] = await Promise.all([getMySongs(), getPracticeSummary()])
  return (
    <div className="pt-2">
      <h1 className="mb-6 font-serif text-2xl text-[color:var(--color-paper)]">Practice</h1>
      <PracticeMode initialSongs={songs ?? []} summary={summary} />
    </div>
  )
}
