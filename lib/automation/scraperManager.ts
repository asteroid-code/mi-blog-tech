import { createClient } from '../supabaseClient'; // Adjusted path
import { RSSScraper2025 } from '../scrapers/2025/rssScraper2025'; // Adjusted path
import { ContentGenerator } from '../ai/contentGenerator'; // Adjusted path
import { AdvancedContentProcessor2025 } from '../processors/advancedContentProcessor'; // Adjusted path
import { ScrapedContent2025 } from '../../types/scraping'; // Adjusted path

export class ScraperManager2025 {
  private rssScraper: RSSScraper2025;
  private contentProcessor: AdvancedContentProcessor2025;
  private contentGenerator: ContentGenerator; // Added
  private supabase = createClient();

  constructor() {
    this.rssScraper = new RSSScraper2025();
    this.contentProcessor = new AdvancedContentProcessor2025();
    this.contentGenerator = new ContentGenerator(); // Initialized
  }

  async startAutomatedScraping() {
    console.log('🚀 Iniciando scraping automático...');

    // 1. Obtener fuentes activas
    const { data: sources, error } = await this.supabase
      .from('scraping_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'rss');

    if (error) throw error;

    // 2. Procesar cada fuente
    for (const source of sources) {
      await this.processSource(source);
    }

    console.log('✅ Scraping automático completado');
  }

  private async processSource(source: any) {
    try {
      console.log(`📡 Scrapeando: ${source.name}`);

      // 3. Scrapear contenido
      const scrapedItems = await this.rssScraper.scrapeFeed(source.url);

      // 4. Procesar cada artículo con IA
      for (const item of scrapedItems.slice(0, source.scraping_strategy?.max_items || 3)) { // Added optional chaining
        await this.processArticle(item, source.id);
      }

      // 5. Actualizar métricas
      await this.updateSourceMetrics(source.id, scrapedItems.length);

    } catch (error) {
      console.error(`❌ Error procesando fuente ${source.name}:`, error);
    }
  }

  private async processArticle(scrapedItem: ScrapedContent2025, sourceId: string) {
    // 6. Verificar si ya existe (evitar duplicados)
    const { data: existing } = await this.supabase
      .from('original_content')
      .select('id')
      .eq('content_hash', this.generateHash(scrapedItem.content))
      .single();

    if (existing) {
      console.log('⏭️  Artículo ya existe, saltando...');
      return;
    }

    // 7. Procesar con IA
    const enhancedContent = await this.contentProcessor.processWithAITrends(scrapedItem);

    // 8. Guardar en original_content
    const { data: savedContent, error } = await this.supabase
      .from('original_content')
      .insert({
        source_id: sourceId,
        title: scrapedItem.title,
        content: scrapedItem.content,
        url: scrapedItem.url,
        author: scrapedItem.author,
        published_at: scrapedItem.published_at,
        content_hash: this.generateHash(scrapedItem.content),
        metadata: scrapedItem.metadata
      })
      .select()
      .single();

    if (error) throw error;

    // 9. Generar contenido con IA y guardar en generated_content
    await this.generateAIContent(savedContent, enhancedContent);
  }

  private generateHash(content: string): string {
    // Simple hash function for demonstration purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private async updateSourceMetrics(sourceId: string, scrapedCount: number) {
    // Implementar lógica para actualizar métricas de la fuente
    console.log(`📊 Actualizando métricas para fuente ${sourceId}: ${scrapedCount} artículos scrapeados.`);
    // Example: Increment a counter in the database
    const { error } = await this.supabase
      .from('scraping_sources')
      .update({ last_scraped_at: new Date().toISOString(), last_scraped_count: scrapedCount })
      .eq('id', sourceId);

    if (error) console.error('Error updating source metrics:', error);
  }

  private async generateAIContent(originalContent: any, enhancedContent: any) {
    const { data: generated, error } = await this.supabase
      .from('generated_content')
      .insert({
        original_content_id: originalContent.id,
        title: enhancedContent.title,
        content: enhancedContent.content,
        summary: enhancedContent.summary,
        category: enhancedContent.category,
        ai_model: enhancedContent.ai_model,
        generated_at: new Date().toISOString(),
        metadata: enhancedContent.metadata
      })
      .select()
      .single();

    if (error) console.error('Error generating AI content:', error);
  }
}
