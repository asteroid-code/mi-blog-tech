import Parser from 'rss-parser';

export class RSSScraper2025 {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 15000,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSSScraper/1.0)'
        }
      },
      customFields: {
        item: [
          'content:encoded',
          'media:thumbnail',
          'dc:creator',
          'description',
          'summary'
        ]
      }
    });
  }

  async scrapeFeed(feedUrl: string): Promise<any[]> {
    try {
      console.log(`🔍 Scrapeando feed: ${feedUrl}`);

      const feed = await this.parser.parseURL(feedUrl);
      console.log(`📊 Feed obtenido: ${feed.title}, Items: ${feed.items?.length || 0}`);

      if (!feed.items || feed.items.length === 0) {
        console.log('⚠️  Feed no contiene items o está vacío');
        return [];
      }

      const results = feed.items.map((item, index) => {
        console.log(`📝 Procesando item ${index + 1}: ${item.title?.substring(0, 50)}...`);

        return {
          source_id: 'rss-source',
          title: item.title || 'Sin título',
          content: this.extractContent(item),
          summary: this.extractSummary(item),
          url: item.link || '',
          author: item.creator || item.author || item['dc:creator'] || 'Desconocido',
          published_at: new Date(item.pubDate || item.isoDate || Date.now()),
          language: 'en',
          content_type: 'article',
          ai_trends: this.extractAITrends(item.title + ' ' + item.contentSnippet),
          metadata: {
            tags: item.categories || [],
            guid: item.guid || ''
          }
        };
      }).filter(item => item.title !== 'Sin título' && item.content.length > 10);

      console.log(`✅ Items procesados: ${results.length}`);
      return results;

    } catch (error: any) {
      console.error(`❌ Error scraping RSS feed ${feedUrl}:`, error.message);

      // Debug adicional
      if (error.message.includes('CORS')) {
        console.log('⚠️  Posible issue de CORS, probando con proxy...');
      }

      return [];
    }
  }

  private extractContent(item: any): string {
    // Múltiples fuentes posibles de contenido
    return item.contentSnippet ||
           item.content ||
           item.description ||
           item.summary ||
           item['content:encoded'] ||
           'Contenido no disponible';
  }

  private extractSummary(item: any): string {
    const content = this.extractContent(item);
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  private extractAITrends(text: string): string[] {
    if (!text) return [];

    const trends2025 = [
      'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'transformer', 'llm', 'gpt', 'ai model',
      'computer vision', 'natural language', 'prompt engineering'
    ];

    return trends2025.filter(trend =>
      text.toLowerCase().includes(trend)
    );
  }
}
