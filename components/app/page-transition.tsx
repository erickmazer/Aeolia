'use client'

import { usePathname } from 'next/navigation'

// Transição de rota: a cada navegação, o conteúdo re-monta e sobe suavemente
// (rise-in). Sem dependências — só a chave de rota + o primitivo `.aeolia-rise`
// do globals.css (que respeita prefers-reduced-motion). Substitui o "hard swap"
// instantâneo entre abas por algo que parece um app.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="aeolia-rise">
      {children}
    </div>
  )
}
