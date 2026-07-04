import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shipporiMincho } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aeolia",
    template: "%s — Aeolia",
  },
  description:
    "Aeolia — plataforma para músicos organizarem repertório, técnicas e a evolução dos seus estudos.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${shipporiMincho.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <main className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
