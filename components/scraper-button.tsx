"use client"

import { useToast } from "@/components/ui/use-toast"

export default function ScraperButton() {
  const { toast } = useToast()

  const handleTestScraper = async () => {
    const url = window.prompt("Introduce la URL a scrapear:")
    if (!url) {
      console.log("Scraping cancelado por el usuario.")
      return
    }
    console.log(`Iniciando scraping para la URL: ${url}`)

    try {
      console.log("Enviando petición a /api/scrape...")
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("La respuesta de la API no fue OK:", errorData)
        throw new Error(errorData.error || "Failed to scrape the URL")
      }

      const data = await response.json()
      console.log("Datos recibidos de la API:", data)
      toast({
        title: "Scraping completado",
        description: `Título extraído: ${data.title}`,
      })
    } catch (error: any) {
      console.error("Error en el scraping:", error)
      toast({
        title: "Error en el scraping",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <button
      onClick={handleTestScraper}
      className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 ease-in-out"
    >
      ⚙️ Probar Scraper
    </button>
  )
}
