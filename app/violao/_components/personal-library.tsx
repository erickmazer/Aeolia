'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Library } from './library'
import { AddSong } from './add-song'
import type { Song } from '../_lib/data'

export function PersonalLibrary({ userId, initialSongs }: { userId: string; initialSongs: Song[] }) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)

  async function handleDelete(song: Song) {
    if (!window.confirm(`Remover "${song.title}" da sua biblioteca?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('songs').delete().eq('id', song.id)
    if (!error) setSongs((cur) => cur.filter((s) => s.id !== song.id))
  }

  return (
    <div className="space-y-12">
      <AddSong userId={userId} onAdded={(song) => setSongs((cur) => [song, ...cur])} />
      <Library songs={songs} editable onDelete={handleDelete} />
    </div>
  )
}
