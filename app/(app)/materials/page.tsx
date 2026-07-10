import { getMyMaterials, getMySongs } from '@/lib/library/queries'
import { MaterialsView, type SongRef } from '@/components/library/materials-view'

export const metadata = { title: 'Materials' }

export default async function MaterialsPage() {
  const [materials, songs] = await Promise.all([getMyMaterials(), getMySongs()])
  const songRefs: SongRef[] = (songs ?? [])
    .filter((s) => s.entryId)
    .map((s) => ({ entryId: s.entryId as string, title: s.title, artist: s.artist }))
  return <MaterialsView initialMaterials={materials} songs={songRefs} />
}
