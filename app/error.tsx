'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-ink)] px-6 text-center">
      <p className="font-serif text-3xl text-[color:var(--color-paper)]">Algo saiu do tom</p>
      <p className="mt-3 max-w-sm leading-relaxed text-[color:var(--color-ash)]">
        Deu um erro inesperado. Tente de novo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md px-5 py-2 text-sm text-[color:var(--color-ink)]"
        style={{ background: 'var(--color-patina)' }}
      >
        tentar de novo
      </button>
    </div>
  )
}
