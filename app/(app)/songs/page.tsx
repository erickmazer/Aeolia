import { getMySongs, getMyMaterials } from '@/lib/library/queries'
import { PersonalLibrary } from '@/components/library/personal-library'
import { RoadmapView } from '@/components/library/roadmap-view'
import type { Material } from '@/lib/library/data'

export const metadata = { title: 'Songs' }

export default async function SongsPage() {
  const [songs, materials] = await Promise.all([getMySongs(), getMyMaterials()])
  const list = songs ?? []

  // Agrupa os materiais atrelados por library_entry, pra exibir na ficha.
  const materialsByEntry: Record<string, Material[]> = {}
  for (const m of materials) {
    if (!m.entryId) continue
    ;(materialsByEntry[m.entryId] ??= []).push(m)
  }

  return (
    <div className="pt-2">
      <h1 className="mb-6 font-serif text-2xl">Songs</h1>
      <PersonalLibrary initialSongs={list} materialsByEntry={materialsByEntry} />
      <RoadmapView ownedTitles={list.map((s) => s.title)} />
    </div>
  )
}
