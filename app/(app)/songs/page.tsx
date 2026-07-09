import { getMySongs } from '@/lib/library/queries'
import { PersonalLibrary } from '@/components/library/personal-library'
import { RoadmapView } from '@/components/library/roadmap-view'

export const metadata = { title: 'Songs' }

export default async function SongsPage() {
  const songs = (await getMySongs()) ?? []
  return (
    <div className="pt-2">
      <h1 className="mb-6 font-serif text-2xl">Songs</h1>
      <PersonalLibrary initialSongs={songs} />
      <RoadmapView ownedTitles={songs.map((s) => s.title)} />
    </div>
  )
}
