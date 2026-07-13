import { getCurrentUser, getMyExercises, getMySongs, getPracticeSummary } from '@/lib/library/queries'
import { deriveSkillXp } from '@/lib/library/skills'
import { ExercisesPanel } from '@/components/library/exercises-panel'
import { YouStats, AccountSection } from '@/components/app/you-panel'

export const metadata = { title: 'Você' }

// Fase 3 do revamp de IA: a aba "Você" consolida ritmo (streak/stats) + skills +
// exercícios + conta. Vira o hub de progresso e identidade.
export default async function VocePage() {
  const [user, songs, levels, summary] = await Promise.all([
    getCurrentUser(),
    getMySongs(),
    getMyExercises(),
    getPracticeSummary(),
  ])
  const skills = deriveSkillXp(songs ?? [])
  const max = Math.max(1, ...skills.map((s) => s.xp))
  const label =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    'você'

  return (
    <div className="pt-2">
      <h1 className="mb-6 font-serif text-2xl">Você</h1>

      <YouStats summary={summary} />

      <section className="mb-10">
        <h2 className="mb-3 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">Suas skills</h2>
        <ul className="space-y-2.5">
          {skills.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-[color:var(--color-paper)]/90">{s.name}</span>
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
              >
                <div className="h-full rounded-full" style={{ width: `${Math.round((s.xp / max) * 100)}%`, background: 'var(--color-patina)' }} />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-[color:var(--color-ash)]">{s.xp}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[color:var(--color-ash)]">
          XP derivado das músicas que você toca (status × dificuldade) + exercícios em treino.
        </p>
      </section>

      {user && <ExercisesPanel userId={user.id} initialLevels={levels} />}

      <AccountSection label={label} />
    </div>
  )
}
