import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "./components/supabase-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TechAI News - Noticias de Tecnología e IA",
  description: "Contenido generado automáticamente las 24 horas sobre tecnología e inteligencia artificial",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <SupabaseProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </SupabaseProvider>
        <Toaster />
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
