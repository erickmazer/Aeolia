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
        {ROADMAP.map((phase) => {
          const ownedCount = phase.songs.filter((t) => owned.has(norm(t))).length
          const complete = phase.songs.length > 0 && ownedCount === phase.songs.length
          const started = ownedCount > 0
          const nodeColor = complete ? 'var(--color-moss)' : started ? 'var(--color-patina)' : 'color-mix(in oklch, var(--color-ash) 45%, transparent)'
          return (
            <li key={phase.fase} className="relative">
              {/* nó da trilha, sobre a linha vertical */}
              <span
                className="absolute top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{
                  left: 'calc(-1.5rem - 7px)',
                  background: started ? nodeColor : 'var(--color-ink)',
                  border: `2px solid ${nodeColor}`,
                  boxShadow: started ? `0 0 0 4px color-mix(in oklch, ${nodeColor} 15%, transparent)` : 'none',
                }}
                aria-hidden
              />
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-widest text-[color:var(--color-patina)]">{phase.fase}</span>
                <span className="text-sm text-[color:var(--color-ash)]">· {phase.tema}</span>
                {phase.songs.length > 0 && (
                  <span className="text-xs tabular-nums text-[color:var(--color-ash)]">{ownedCount}/{phase.songs.length}</span>
                )}
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
                        border: has ? 'none' : '1px solid color-mix(in oklch, var(--color-ash) 20%, transparent)',
                      }}
                    >
                      {has && <span aria-hidden>✓ </span>}
                      {title}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
