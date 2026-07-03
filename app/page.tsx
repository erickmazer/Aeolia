import { redirect } from "next/navigation";

// Projeto único neste repo: a página pública do músico vive em /musician/[username].
export default function Home() {
  redirect("/musician/erick");
}
