import Link from 'next/link'
import { Ja } from '@/components/Ja'
import { Library } from './_components/library'
import { getShowcaseSongs, getCurrentUser } from './_lib/queries'

export const metadata = {
  title: 'Biblioteca Musical',
  description:
    'Um guia vivo da minha evolução na música — repertório, técnicas e objetivos organizados como um mapa da jornada.',
}

const objetivos = [
  'Construir um repertório que eu realmente tenha vontade de tocar.',
  'Aprender novas técnicas através de músicas, e não de exercícios soltos.',
  'Criar um registro da minha evolução.',
  'Descobrir novos artistas e músicas alinhados ao meu gosto.',
  'Ter um repertório especial para tocar para minha filha.',
]

export default async function BibliotecaPage() {
  const [songs, user] = await Promise.all([getShowcaseSongs(), getCurrentUser()])

  return (
    <div className="relative z-0 min-h-screen bg-[color:var(--color-ink)] px-8 py-16 sm:px-12 md:px-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
        >
          ← back
        </Link>

        <header className="mb-16 mt-16">
          <Ja
            className="mb-2 block text-7xl leading-none text-[color:var(--color-patina)] [font-family:var(--font-serif-jp)] [text-box:trim-start_cap_alphabetic] md:text-8xl"
            title="michi — the way, the path"
            aria-label="michi — the way, the path"
          >
            道
          </Ja>
          <p className="mb-8 text-xs uppercase tracking-widest text-[color:var(--color-ash)]">michi — the way</p>

          <h1 className="mb-6 font-serif text-3xl leading-tight [text-box:trim-start_cap_alphabetic] md:text-4xl">
            Biblioteca Musical
          </h1>
          <p className="max-w-prose leading-relaxed text-[color:var(--color-paper)]/85">
            Um guia vivo para acompanhar minha evolução na música ao longo dos anos. Em vez de apenas
            listar músicas, ela organiza o aprendizado em torno de <em>repertório</em>, <em>técnicas</em> e{' '}
            <em>objetivos pessoais</em>. Com o tempo, deixa de ser uma lista e vira um mapa da jornada —
            mostrando não só o que aprendi, mas como meu gosto e minha forma de tocar evoluíram.
          </p>
          <p className="mt-3 max-w-prose text-sm italic leading-relaxed text-[color:var(--color-ash)]">
            Um projeto vivo. Atualizado quando descubro uma música, termino de aprender uma, ou evoluo em
            alguma técnica — não numa agenda.
          </p>

          <ul className="mt-8 space-y-2">
            {objetivos.map((o) => (
              <li key={o} className="flex gap-3 text-sm leading-relaxed text-[color:var(--color-paper)]/80">
                <span aria-hidden className="text-[color:var(--color-patina)]">—</span>
                <span className="max-w-prose">{o}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-[color:var(--color-ash)]">
            <Link
              href="/biblioteca/minha"
              className="text-[color:var(--color-patina)] underline decoration-[color:var(--color-ash)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--color-paper)]"
            >
              {user ? '→ minha biblioteca' : '→ montar a minha biblioteca'}
            </Link>
          </p>
        </header>

        <Library songs={songs} />
      </div>
    </div>
  )
}
