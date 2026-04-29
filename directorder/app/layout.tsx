import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "DirectOrder — Menú Digital para Restaurantes",
  description: "SaaS multi-tenant para restaurantes. Menú digital, pedidos por WhatsApp, cocina en tiempo real y analytics. Sin comisiones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className={`${outfit.className} min-h-screen antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
