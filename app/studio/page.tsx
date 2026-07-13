import { redirect } from 'next/navigation'

// A antiga /studio virou a aba "Biblioteca" dentro da casca do app.
export default function StudioRedirect() {
  redirect('/biblioteca')
}
