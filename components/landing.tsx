import Link from 'next/link'

export function Landing() {
  return (
    <div className="relative z-0 flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-ink)] px-6 text-center">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-5xl leading-none text-[color:var(--color-paper)]">Aeolia</h1>
        <p className="mt-4 leading-relaxed text-[color:var(--color-paper)]/85">
          Sua jornada musical — repertório, técnicas e progresso, organizados como um mapa da sua evolução.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ash)]">
          Comece com violão; feito pra praticar no celular, dia após dia.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/today"
            className="rounded-md px-6 py-2.5 text-sm text-[color:var(--color-ink)] transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-patina)' }}
          >
            Entrar
          </Link>
          <Link
            href="/musician/erick"
            className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
          >
            ver uma biblioteca de exemplo →
          </Link>
        </div>
      </div>
    </div>
  )
}
