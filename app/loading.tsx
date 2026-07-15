import { Spinner } from '@/components/app/spinner'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-ink)]">
      <span className="inline-flex items-center gap-2.5 text-sm tracking-widest text-[color:var(--color-ash)]">
        <Spinner className="h-4 w-4" />
        carregando…
      </span>
    </div>
  )
}
