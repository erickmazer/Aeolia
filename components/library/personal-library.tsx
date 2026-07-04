'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Library } from './library'
import { AddSong } from './add-song'
import type { Song } from '@/lib/library/data'

export function PersonalLibrary({ initialSongs }: { initialSongs: Song[] }) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)

  async function handleDelete(song: Song) {
    if (!song.entryId) return
    if (!window.confirm(`Remover "${song.title}" da sua biblioteca?`)) return
    const supabase = createClient()
    // Remove só a entrada do usuário; a música canônica permanece no catálogo.
    const { error } = await supabase.from('library_entries').delete().eq('id', song.entryId)
    if (!error) setSongs((cur) => cur.filter((s) => s.entryId !== song.entryId))
  }

  return (
    <div className="space-y-12">
      <AddSong onAdded={(song) => setSongs((cur) => [song, ...cur])} />
      <Library songs={songs} editable onDelete={handleDelete} />
    </div>
  )
}
