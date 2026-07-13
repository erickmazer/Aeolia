import { redirect } from 'next/navigation'

// Revamp de IA: Songs foi absorvido pela aba "Biblioteca".
export default function SongsRedirect() {
  redirect('/biblioteca')
}
