// Spinner reutilizável (anel girando) — o mesmo vocabulário do estado de geração
// da IA. Usado no lugar de labels de texto ("salvando…", "pensando…") pra dar
// feedback vivo nas ações.
export function Spinner({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  )
}

// Rótulo com spinner à esquerda, pra usar dentro de botões enquanto ocupados.
export function Loading({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      {children}
    </span>
  )
}
