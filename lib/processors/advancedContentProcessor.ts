import { ContentGenerator } from '../ai/contentGenerator'; // Adjusted path
import { AIClients } from '../ai/clients'; // Adjusted path
import { ScrapedContent2025 } from '../../types/scraping'; // Adjusted path

export class AdvancedContentProcessor2025 {
  private contentGenerator: ContentGenerator;
  private aiClients: AIClients;

  constructor() {
    this.contentGenerator = new ContentGenerator();
    this.aiClients = new AIClients();
  }

  async processWithAITrends(scrapedContent: ScrapedContent2025) {
    // 1. Analizar contenido con IA para extraer temas clave
    const analysis = await this.analyzeContent(scrapedContent);

    // 2. Generar prompt optimizado
    const optimizedPrompt = this.createOptimizedPrompt(scrapedContent, analysis);

    // 3. Generar contenido mejorado
    return await this.contentGenerator.generateMultimediaContent(
      optimizedPrompt,
      this.mapToCategory(scrapedContent.ai_trends || [])
    );
  }

  private async analyzeContent(content: ScrapedContent2025) {
    // Usar OpenAI para analizar el contenido
    const client = this.aiClients.getOpenAIClient();

    const response = await client.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Analiza este contenido y extrae temas clave de IA: ${content.title} - ${content.summary}`
      }],
      model: 'gpt-3.5-turbo',
      max_tokens: 100
    });

    return response.choices[0]?.message?.content || '';
  }

  private createOptimizedPrompt(scrapedContent: ScrapedContent2025, analysis: string): string {
    // Implementar lógica para crear un prompt optimizado basado en el contenido y el análisis
    return `Genera contenido multimedia basado en el artículo "${scrapedContent.title}". Temas clave de IA: ${analysis}. Contenido original: ${scrapedContent.content}`;
  }

  private mapToCategory(aiTrends: string[]): string {
    // Implementar lógica para mapear tendencias de IA a una categoría
    if (aiTrends.includes('Machine Learning') || aiTrends.includes('Deep Learning')) {
      return 'Machine Learning';
    }
    if (aiTrends.includes('GPT') || aiTrends.includes('LLM')) {
      return 'Generative AI';
    }
    if (aiTrends.includes('Artificial Intelligence') || aiTrends.includes('AI')) {
      return 'General AI';
    }
    return 'Technology';
  }
}
