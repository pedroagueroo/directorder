import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/common/AppToaster";

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

/** Viewport móvil: escala correcta, notch/home indicator (iOS), tema en barra de estado */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(40 40% 97%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(24 18% 9%)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className={`${outfit.className} min-h-screen min-h-[100dvh] antialiased bg-background text-foreground overflow-x-hidden`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
