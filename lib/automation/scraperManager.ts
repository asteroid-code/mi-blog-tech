import { createClient } from '../supabase/client';
import { RSSScraper2025 } from '../scrapers/2025/rssScraper2025';
import { ContentGenerator } from '../ai/contentGenerator';

export class ScraperManager2025 {
  private scraper: RSSScraper2025;
  private contentGenerator: ContentGenerator;
  private supabase = createClient();

  constructor() {
    this.scraper = new RSSScraper2025();
    this.contentGenerator = new ContentGenerator();
  }

  async startAutomatedScraping() {
    const startTime = Date.now();
    let sourcesProcessed = 0;
    let itemsGenerated = 0;

    try {
      console.log('🔄 Iniciando proceso de scraping automático...');

      // Obtener fuentes activas
      const { data: sources, error } = await this.supabase
        .from('scraping_sources')
        .select('*')
        .eq('is_active', true)
        .eq('source_type', 'rss');

      if (error) throw error;
      if (!sources || sources.length === 0) {
        console.log('ℹ️ No hay fuentes activas para procesar');
        return { sources_processed: 0, items_generated: 0, execution_time: 0 };
      }

      console.log(`📡 Procesando ${sources.length} fuentes activas...`);

      // Procesar cada fuente
      for (const source of sources) {
        try {
          console.log(`🔍 Scrapeando: ${source.name}`);
          const scrapedItems = await this.scraper.scrapeFeed(source.url);

          if (scrapedItems.length > 0) {
            const processed = await this.processScrapedItems(scrapedItems, source.id);
            itemsGenerated += processed;
          }

          sourcesProcessed++;

          // Actualizar última fecha de scraping
          await this.supabase
            .from('scraping_sources')
            .update({
              last_successful_scrape: new Date().toISOString(),
              scrape_metrics: {
                total_scraped: (source.scrape_metrics?.total_scraped || 0) + scrapedItems.length,
                success_rate: 100
              }
            })
            .eq('id', source.id);

          console.log(`✅ ${source.name}: ${scrapedItems.length} items encontrados`);

        } catch (sourceError) {
          console.error(`❌ Error procesando fuente ${source.name}:`, sourceError);
          // Continuar con la siguiente fuente
          continue;
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(`🎉 Proceso completado: ${sourcesProcessed} fuentes, ${itemsGenerated} items generados en ${executionTime}ms`);

      return {
        sources_processed: sourcesProcessed,
        items_generated: itemsGenerated,
        execution_time: executionTime
      };

    } catch (error) {
      console.error('💥 Error crítico en scraping automático:', error);
      throw error;
    }
  }

  private async processScrapedItems(items: any[], sourceId: string) {
    let processedCount = 0;

    for (const item of items.slice(0, 5)) { // Limitar a 5 items por fuente
      try {
        // Verificar si ya existe
        const contentHash = this.generateContentHash(item.content);
        const { data: existing } = await this.supabase
          .from('original_content')
          .select('id')
          .eq('content_hash', contentHash)
          .single();

        if (existing) {
          console.log('⏭️ Contenido duplicado, saltando...');
          continue;
        }

        // Generar contenido con IA
        const generatedContent = await this.contentGenerator.generateMultimediaContent(
          item.title,
          'technology' // Categoría por defecto
        );

        // Guardar en generated_content
        const { error } = await this.supabase
          .from('generated_content')
          .insert({
            title: generatedContent.title,
            content: generatedContent.content,
            summary: generatedContent.summary,
            ai_provider: 'openai',
            ai_model: 'gpt-4',
            status: 'published',
            word_count: generatedContent.word_count,
            reading_time: generatedContent.reading_time,
            tags: generatedContent.tags,
            image_url: generatedContent.image_descriptions[0] || null
          });

        if (!error) processedCount++;

      } catch (itemError) {
        console.error('Error procesando item:', itemError);
        continue;
      }
    }

    return processedCount;
  }

  private generateContentHash(content: string): string {
    // Implementar hash simple para detección de duplicados
    return Buffer.from(content).toString('base64').substring(0, 50);
  }
}
