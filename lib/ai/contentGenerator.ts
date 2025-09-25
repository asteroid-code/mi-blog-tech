import { AIManager } from './aiManager';
import { GeneratedContent } from '@/types/ai';

export class ContentGenerator {
  private aiManager: AIManager;

  constructor() {
    this.aiManager = new AIManager();
  }

  async generateMultimediaContent(topic: string, category?: string): Promise<GeneratedContent> {
    const preferredProviderName = this.aiManager.getPreferredProvider();
    const provider = this.aiManager.getProvider(preferredProviderName);

    const prompt = `Generate a comprehensive article about "${topic}". If a category is provided, tailor the content for "${category}". The output should be structured to include a title, the main content, a summary, image descriptions, video suggestions, and relevant tags.`;

    const generatedContent = await provider.generateContent(prompt, {
      // You can pass model specific options here if needed
      // For example: model: 'gpt-4o' or 'gemini-pro'
    });

    return generatedContent;
  }
}
