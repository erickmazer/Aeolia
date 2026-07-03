import { redirect } from "next/navigation";

// Projeto único neste repo: a Biblioteca Musical vive em /biblioteca.
export default function Home() {
  redirect("/biblioteca");
}
