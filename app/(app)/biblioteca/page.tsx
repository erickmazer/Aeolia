import { getMySongs, getMyMaterials } from '@/lib/library/queries'
import { PersonalLibrary } from '@/components/library/personal-library'
import { MaterialsView, type SongRef } from '@/components/library/materials-view'
import type { Material } from '@/lib/library/data'

export const metadata = { title: 'Biblioteca' }

// Fase 0 do revamp de IA: a aba "Biblioteca" reagrupa Songs + Materials num
// acervo só. A Fase 2 converte a ficha em bottom sheet e integra os materiais
// como filtro em vez de seção separada.
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
    <div className="space-y-12 pt-2">
      <h1 className="font-serif text-2xl">Biblioteca</h1>
      <PersonalLibrary initialSongs={list} materialsByEntry={materialsByEntry} />
      <section className="border-t pt-10" style={{ borderColor: 'color-mix(in oklch, var(--color-ash) 20%, transparent)' }}>
        <MaterialsView initialMaterials={materials} songs={songRefs} />
      </section>
    </div>
  )
}
