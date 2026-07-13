import { redirect } from 'next/navigation'

// Revamp de IA: Practice foi absorvido pela aba "Praticar".
export default function PracticeRedirect() {
  redirect('/praticar')
}
