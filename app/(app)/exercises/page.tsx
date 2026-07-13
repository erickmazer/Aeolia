import { redirect } from 'next/navigation'

// Revamp de IA: Exercises foi absorvido pela aba "Você".
export default function ExercisesRedirect() {
  redirect('/voce')
}
