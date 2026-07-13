import { getMySongs, getPracticeSummary } from '@/lib/library/queries'
import { TodayCockpit } from '@/components/app/today-cockpit'
import { PracticeMode } from '@/components/library/practice-mode'
import { RoadmapView } from '@/components/library/roadmap-view'

export const metadata = { title: 'Praticar' }

// Fase 0 do revamp de IA: a aba "Praticar" reagrupa o que hoje vive em Today +
// Practice + a trilha (Roadmap). Por ora só empilha os componentes existentes;
// a Fase 1 funde tudo num fluxo de sessão único.
export default async function PraticarPage() {
  const [songs, summary] = await Promise.all([getMySongs(), getPracticeSummary()])
  const list = songs ?? []

  return (
    <div className="space-y-12 pt-2">
      <TodayCockpit initialSongs={list} summary={summary} />

      <section>
        <h2 className="mb-4 font-serif text-2xl">Modo prática</h2>
        <PracticeMode initialSongs={list} summary={summary} />
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Sua trilha</h2>
        <RoadmapView ownedTitles={list.map((s) => s.title)} />
      </section>
    </div>
  )
}
