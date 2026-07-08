import { ROADMAP } from '@/lib/library/roadmap'

// normaliza título pra casar com o que a pessoa tem (acento/caixa-insensível)
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function RoadmapView({ ownedTitles }: { ownedTitles: string[] }) {
  const owned = new Set(ownedTitles.map(norm))
  return (
    <section className="mt-12">
      <h2 className="mb-1 font-serif text-2xl">Trilha</h2>
      <p className="mb-6 max-w-prose text-sm leading-relaxed text-[color:var(--color-ash)]">
        Uma progressão sugerida por fases. O que já está na sua biblioteca aparece marcado.
      </p>
      <ol className="relative space-y-8 border-l pl-6" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}>
        {ROADMAP.map((phase) => (
          <li key={phase.fase}>
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-widest text-[color:var(--color-patina)]">{phase.fase}</span>
              <span className="text-sm text-[color:var(--color-ash)]">· {phase.tema}</span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {phase.songs.map((title) => {
                const has = owned.has(norm(title))
                return (
                  <li
                    key={title}
                    className="rounded-full px-3 py-1 text-sm"
                    style={{
                      color: has ? 'var(--color-ink)' : 'var(--color-paper)',
                      background: has ? 'var(--color-moss)' : 'color-mix(in oklch, var(--color-paper) 5%, transparent)',
                    }}
                  >
                    {has && <span aria-hidden>✓ </span>}
                    {title}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
