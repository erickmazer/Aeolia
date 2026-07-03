import { redirect } from "next/navigation";

// Projeto único neste repo: a Biblioteca do Violonista vive em /violao.
export default function Home() {
  redirect("/violao");
}
