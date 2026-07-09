import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shipporiMincho } from "@/lib/fonts";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aeolia",
    template: "%s — Aeolia",
  },
  description:
    "Aeolia — plataforma para músicos organizarem repertório, técnicas e a evolução dos seus estudos.",
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Aeolia" },
};

export const viewport: Viewport = {
  themeColor: "#1c1a17",
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
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
