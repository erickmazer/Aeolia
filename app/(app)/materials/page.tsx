import { redirect } from 'next/navigation'

// Revamp de IA: Materials foi absorvido pela aba "Biblioteca".
export default function MaterialsRedirect() {
  redirect('/biblioteca')
}
