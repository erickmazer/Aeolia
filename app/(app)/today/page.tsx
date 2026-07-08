import { getMySongs } from '@/lib/library/queries'
import { TodayCockpit } from '@/components/app/today-cockpit'

export const metadata = { title: 'Today' }

export default async function TodayPage() {
  const songs = (await getMySongs()) ?? []
  return <TodayCockpit initialSongs={songs} />
}
