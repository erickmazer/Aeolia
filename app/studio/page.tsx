import { redirect } from 'next/navigation'

// A antiga /studio virou a aba "Songs" dentro da casca do app.
export default function StudioRedirect() {
  redirect('/songs')
}
