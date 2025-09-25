import { createClient } from './supabaseClient';
import { RSSScraper2025 } from './scrapers/2025/rssScraper2025';

export class ScraperManager2025 {
  private scraper: RSSScraper2025;
  private supabase = createClient();

  constructor() {
    this.scraper = new RSSScraper2025();
  }

  async startAutomatedScraping() {
    try {
      console.log('🔍 Iniciando scraping automático...');

      // Obtener fuentes activas
      const { data: sources } = await this.supabase
        .from('scraping_sources')
        .select('*')
        .eq('is_active', true)
        .limit(3);

      if (!sources || sources.length === 0) {
        return { sources_processed: 0, items_processed: 0 };
      }

      let totalItems = 0;

      for (const source of sources) {
        const items = await this.scraper.scrapeFeed(source.url);
        totalItems += items.length;
        console.log(`✅ ${source.name}: ${items.length} items`);
      }

      return {
        sources_processed: sources.length,
        items_processed: totalItems,
        message: 'Scraping completado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error en scraping automático:', error);
      throw error;
    }
  }

  async scrapeSource(sourceId: number) {
    try {
      console.log(`🔍 Iniciando scraping para la fuente ID: ${sourceId}...`);

      const { data: source, error: fetchError } = await this.supabase
        .from('scraping_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError || !source) {
        console.error(`❌ Error al obtener la fuente ${sourceId}:`, fetchError?.message || 'Fuente no encontrada');
        throw new Error(`Fuente de scraping no encontrada o error al obtenerla: ${sourceId}`);
      }

      const items = await this.scraper.scrapeFeed(source.url);
      console.log(`✅ ${source.name}: ${items.length} items scrapeados.`);

      return {
        source_id: sourceId,
        items_processed: items.length,
        message: `Scraping completado para la fuente ${source.name}`
      };

    } catch (error) {
      console.error(`❌ Error en scraping para la fuente ${sourceId}:`, error);
      throw error;
    }
  }
}
