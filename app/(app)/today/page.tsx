import { getMySongs, getPracticeSummary } from '@/lib/library/queries'
import { TodayCockpit } from '@/components/app/today-cockpit'

export const metadata = { title: 'Today' }

export default async function TodayPage() {
  const [songs, summary] = await Promise.all([getMySongs(), getPracticeSummary()])
  return <TodayCockpit initialSongs={songs ?? []} summary={summary} />
}
