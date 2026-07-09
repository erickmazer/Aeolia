import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-ink)] px-6 text-center">
      <p className="font-serif text-5xl text-[color:var(--color-patina)]">404</p>
      <p className="mt-3 max-w-sm leading-relaxed text-[color:var(--color-paper)]/85">
        Essa página não existe (ou saiu de cena).
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
      >
        ← voltar ao início
      </Link>
    </div>
  )
}
