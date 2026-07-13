import { getMySongs, getMyMaterials } from '@/lib/library/queries'
import { PersonalLibrary } from '@/components/library/personal-library'
import { MaterialsView, type SongRef } from '@/components/library/materials-view'
import { BibliotecaTabs } from '@/components/library/biblioteca-tabs'
import type { Material } from '@/lib/library/data'

export const metadata = { title: 'Biblioteca' }

// Acervo do usuário: Músicas e Materiais num segmented, um de cada vez (em vez
// de empilhar as duas listas numa página longa). A ficha da música abre em
// bottom sheet (Fase 2).
export default async function BibliotecaPage() {
  const [songs, materials] = await Promise.all([getMySongs(), getMyMaterials()])
  const list = songs ?? []

  const materialsByEntry: Record<string, Material[]> = {}
  for (const m of materials) {
    if (!m.entryId) continue
    ;(materialsByEntry[m.entryId] ??= []).push(m)
  }

  const songRefs: SongRef[] = list
    .filter((s) => s.entryId)
    .map((s) => ({ entryId: s.entryId as string, title: s.title, artist: s.artist }))

  return (
    <div className="pt-2">
      <h1 className="mb-6 font-serif text-2xl">Biblioteca</h1>
      <BibliotecaTabs
        musicas={<PersonalLibrary initialSongs={list} materialsByEntry={materialsByEntry} />}
        materiais={<MaterialsView initialMaterials={materials} songs={songRefs} />}
      />
    </div>
  )
}
