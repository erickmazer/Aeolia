import { getMySongs, getPracticeSummary, getMyExercises } from '@/lib/library/queries'
import { PracticeSession, type ExerciseSuggestion } from '@/components/practice/practice-session'
import { RoadmapView } from '@/components/library/roadmap-view'
import { EXERCISES, EX_MAX } from '@/lib/library/exercises'
import { SKILLS } from '@/lib/library/data'

export const metadata = { title: 'Praticar' }

// Fase 1 do revamp: Praticar funde o antigo Today + Practice num fluxo de sessão
// único (um item por vez), com a trilha (Roadmap) como espinha de progresso.
export default async function PraticarPage() {
  const [songs, summary, levels] = await Promise.all([
    getMySongs(),
    getPracticeSummary(),
    getMyExercises(),
  ])
  const list = songs ?? []

  // Sugere o primeiro exercício ainda não dominado (nível de treino < máximo).
  const ex = EXERCISES.find((e) => (levels[e.id] ?? 0) < EX_MAX)
  const exercise: ExerciseSuggestion | null = ex
    ? { name: ex.nome, desc: ex.desc, skill: SKILLS.find((s) => s.id === ex.alvo)?.name ?? ex.alvo }
    : null

  return (
    <div className="space-y-14 pt-2">
      <PracticeSession initialSongs={list} summary={summary} exercise={exercise} />

      <section>
        <h2 className="mb-4 font-serif text-2xl">Sua trilha</h2>
        <RoadmapView ownedTitles={list.map((s) => s.title)} />
      </section>
    </div>
  )
}
