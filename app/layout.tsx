import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "./components/supabase-provider"
import { Header } from "@/components/header" // Import the Header component
import { ThemeProvider } from "@/components/theme-provider" // Import ThemeProvider
import { getCategories } from "@/lib/contentService" // Import getCategories

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  shrinkToFit: "no",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const categories = await getCategories(); // Fetch categories

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <Header categories={categories} /> {/* Pass categories to Header */}
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </SupabaseProvider>
          <Toaster />
          {/* <Analytics /> */}
        </ThemeProvider>
      </body>
    </html>
  )
}
