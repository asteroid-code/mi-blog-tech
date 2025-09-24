import { createClient } from '@/lib/supabaseClient';

// Define interfaces for better type safety
interface ScrapingSource {
  id: number;
  name: string;
  url: string;
  source_type: 'rss' | 'website' | 'api';
  // Add other relevant fields for a scraping source
}

interface OriginalContent {
  id: number;
  source_id: number;
  title: string;
  content: string;
  url: string;
  // Add other relevant fields for original content
}

export class ScraperManager {
  private supabase = createClient();

  async scrapeAllSources() {
    const { data: sources, error } = await this.supabase
      .from('scraping_sources')
      .select('*');

    if (error) {
      console.error('Error fetching scraping sources:', error);
      throw error;
    }

    if (sources) {
      for (const source of sources) {
        await this.processSource(source);
      }
    }
  }

  private async processSource(source: ScrapingSource) {
    console.log(`Processing source: ${source.name} (${source.url})`);
    // Placeholder for actual scraping logic
    let scrapedContent: { title: string; content: string; url: string } | null = null;

    switch (source.source_type) {
      case 'rss':
        // Implement RSS scraping logic
        scrapedContent = {
          title: `Scraped RSS from ${source.name}`,
          content: `Content from RSS feed of ${source.name}`,
          url: source.url,
        };
        break;
      case 'website':
        // Implement website scraping logic (e.g., using a headless browser or cheerio)
        scrapedContent = {
          title: `Scraped Website from ${source.name}`,
          content: `Content from website of ${source.name}`,
          url: source.url,
        };
        break;
      case 'api':
        // Implement API scraping logic
        scrapedContent = {
          title: `Scraped API from ${source.name}`,
          content: `Content from API of ${source.name}`,
          url: source.url,
        };
        break;
      default:
        console.warn(`Unknown source type: ${source.source_type}`);
        return;
    }

    if (scrapedContent) {
      await this.saveOriginalContent(source.id, scrapedContent);
    }
  }

  private async saveOriginalContent(sourceId: number, content: { title: string; content: string; url: string }) {
    const { data, error } = await this.supabase
      .from('original_content')
      .insert([
        {
          source_id: sourceId,
          title: content.title,
          content: content.content,
          url: content.url,
          // Add other fields as necessary
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving original content:', error);
      throw error;
    }
    console.log('Saved original content:', data);
  }

  // Method to scrape a single source, useful for workers
  async scrapeSource(sourceId: number) {
    const { data: source, error } = await this.supabase
      .from('scraping_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error) {
      console.error(`Error fetching source with ID ${sourceId}:`, error);
      throw error;
    }

    if (source) {
      await this.processSource(source);
    } else {
      console.warn(`Scraping source with ID ${sourceId} not found.`);
    }
  }
}
