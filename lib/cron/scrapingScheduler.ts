import { ScraperManager2025 } from '../automation/scraperManager'; // Adjusted path

export async function performScraping() {
  try {
    const scraperManager = new ScraperManager2025();
    await scraperManager.startAutomatedScraping();

    return { success: true, message: 'Scraping completado exitosamente' };
  } catch (error: any) { // Added any type for error
    console.error('Error en scraping automático:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar cada hora
export function scheduleScraping() {
  // Para producción: Usar cron jobs de Vercel o similar
  setInterval(async () => {
    await performScraping();
  }, 60 * 60 * 1000); // Cada hora
}
