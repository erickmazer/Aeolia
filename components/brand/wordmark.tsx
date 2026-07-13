// Wordmark da marca — texto vivo em Zodiak (--font-brand), herda a cor via
// currentColor, então funciona em fundo claro ou escuro. Duas variantes:
//  - ligature: "Æolia" (amarra ao ícone; use ao menos uma vez perto do símbolo)
//  - padrão:   "Aeolia" (legível; abas, contextos onde clareza importa)
// Até a Zodiak carregar, cai em Georgia (o fallback de --font-brand).

export function Wordmark({
  ligature = false,
  className,
}: {
  ligature?: boolean
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label="Aeolia"
      className={className}
      style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, letterSpacing: '-0.01em' }}
    >
      {/* aria-hidden no texto: o rótulo acessível já é "Aeolia" acima, então a
          ligadura não é lida letra a letra. */}
      <span aria-hidden>{ligature ? 'Æolia' : 'Aeolia'}</span>
    </span>
  )
}
