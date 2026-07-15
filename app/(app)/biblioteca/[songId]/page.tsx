import { notFound } from 'next/navigation'
import { getMySongs, getMyMaterials } from '@/lib/library/queries'
import { SongDetail } from '@/components/library/song-detail'

// Página da música na biblioteca pessoal. Substitui o bottom sheet por uma rota
// de verdade (com a transição de entrada do app-shell).
export default async function SongPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params
  const [songs, materials] = await Promise.all([getMySongs(), getMyMaterials()])
  const list = songs ?? []
  const song = list.find((s) => s.id === songId)
  if (!song) notFound()

  // Nomes das músicas do usuário (pra rotular pré-requisitos/próximas linkáveis).
  const related: Record<string, string> = {}
  for (const s of list) related[s.id] = s.title

  const mats = song.entryId ? materials.filter((m) => m.entryId === song.entryId) : []

  return <SongDetail song={song} related={related} materials={mats} />
}
