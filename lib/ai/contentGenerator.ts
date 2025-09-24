import { AIClients } from './clients';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from 'groq-sdk';
import { CohereClient } from 'cohere-ai';

interface GeneratedContent {
  outline: string;
  content: string;
  multimediaSuggestions: MultimediaData;
  seoScore: SEOScore;
}

interface MultimediaData {
  images: string[];
  videos: string[];
  tags: string[];
}

interface SEOScore {
  readability: number;
  keywordDensity: { [key: string]: number };
  sentiment: string;
}

interface GenerationStrategy {
  primary: string[];
  fallbacks: Map<string, string[]>; // Proveedor → alternativas
  timeouts: Map<string, number>; // Timeouts por proveedor
}

const GENERATION_STRATEGIES = {
  STANDARD: {
    outline: ['google', 'openai', 'groq'],
    content: ['openai', 'google', 'cohere'],
    multimedia: ['huggingface', 'google', 'openai']
  },
  FAST: {
    outline: ['groq', 'google'],
    content: ['cohere', 'openai'],
    multimedia: ['huggingface']
  },
  QUALITY: {
    outline: ['google', 'openai'],
    content: ['openai', 'google'],
    multimedia: ['google', 'openai', 'huggingface']
  }
};

export class MultimediaContentGenerator {
  private clients: AIClients;
  private strategy: typeof GENERATION_STRATEGIES.STANDARD; // Default strategy

  constructor(clients: AIClients, strategyType: keyof typeof GENERATION_STRATEGIES = 'STANDARD') {
    this.clients = clients;
    this.strategy = GENERATION_STRATEGIES[strategyType];
  }

  async generateCompleteArticle(topic: string, category?: string): Promise<GeneratedContent> {
    // 1. Google Gemini: Planificación y estructura (calidad)
    const outlinePrompt = `Generate a detailed outline for an article about "${topic}"${category ? ` in the category "${category}"` : ''}. The outline should include main sections and sub-sections.`;
    const outline = await this.attemptGenerationWithFallback(outlinePrompt, this.strategy.outline);

    // 2. OpenAI: Desarrollo de contenido (precisión)
    const contentPrompt = `Write a comprehensive article based on the following outline and topic:
    Topic: "${topic}"
    Outline:
    ${outline}
    Ensure the content is precise, informative, and engaging.`;
    const content = await this.attemptGenerationWithFallback(contentPrompt, this.strategy.content);

    // 3. Cohere: Optimización para español (fluidez) - Assuming content is initially in English or needs refinement
    const spanishOptimizationPrompt = `Optimize the following article content for fluency and natural language in Spanish. Ensure cultural nuances are respected.
    Content:
    ${content}`;
    const optimizedContent = await this.attemptGenerationWithFallback(spanishOptimizationPrompt, ['cohere']); // Cohere for Spanish optimization

    // 4. HuggingFace: Análisis multimedia (sugerencias)
    const multimediaSuggestions = await this.generateMultimediaSuggestions(topic, optimizedContent);

    // 5. Groq: Validación rápida (verificación) - This step might be more about quick checks or summaries
    // For now, we'll just calculate SEO. A "validation" step could involve summarizing or checking for factual errors.
    const seoScore = this.calculateSEOOptimization(optimizedContent);

    return {
      outline,
      content: optimizedContent,
      multimediaSuggestions,
      seoScore,
    };
  }

  private async attemptGenerationWithFallback(prompt: string, providers: string[]): Promise<string> {
    for (const provider of providers) {
      try {
        let result: string = '';
        switch (provider) {
          case 'google':
            result = await this.generateWithGoogleGemini(prompt);
            break;
          case 'openai':
            result = await this.generateWithOpenAI(prompt);
            break;
          case 'cohere':
            // Assuming getCohereCompletion is available or integrated
            const cohereClient = this.clients.getCohereClient();
            const cohereResponse = await cohereClient.chat({ message: prompt, model: 'command-r-plus' });
            result = cohereResponse.text;
            break;
          case 'groq':
            // Assuming getGroqCompletion is available or integrated
            const groqClient = this.clients.getGroqClient();
            const groqResponse = await groqClient.chat.completions.create({
              messages: [{ role: 'user', content: prompt }],
              model: 'llama3-8b-8192',
            });
            result = groqResponse.choices[0]?.message?.content || '';
            break;
          case 'huggingface':
            // HuggingFace is typically for specific tasks, not general text generation.
            // This case might need a more specific implementation based on the task.
            // For now, we'll treat it as a fallback for text generation, which might not be ideal.
            // A more robust solution would involve specific HF models for text generation.
            console.warn(`HuggingFace used for general text generation, which might not be optimal.`);
            const hfApiKey = this.clients.getHuggingFaceApiKey();
            if (!hfApiKey) throw new Error('HuggingFace API Key not set.');
            const hfResponse = await fetch(
              `https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta`, // Example model
              {
                headers: {
                  Authorization: `Bearer ${hfApiKey}`,
                  'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({ inputs: prompt }),
              }
            );
            const hfResult = await hfResponse.json();
            result = hfResult[0]?.generated_text || '';
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
        if (result) {
          console.log(`Generation successful with ${provider}.`);
          return result;
        }
      } catch (error) {
        console.error(`Provider ${provider} failed: ${error instanceof Error ? error.message : String(error)}. Attempting fallback...`);
      }
    }
    throw new Error('All providers failed to generate content.');
  }

  private async generateWithGoogleGemini(prompt: string): Promise<string> {
    const model = this.clients.getGoogleClient().getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    const openai = this.clients.getOpenAIClient();
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
    });
    return chatCompletion.choices[0]?.message?.content || '';
  }

  private async generateMultimediaSuggestions(topic: string, content: string): Promise<MultimediaData> {
    // This would typically involve calling another AI model (e.g., a vision model or a specialized text-to-image prompt generator)
    // For now, we'll simulate suggestions based on keywords.
    const keywords = topic.split(' ').concat(content.split(' ').slice(0, 5)); // Simple keyword extraction
    return {
      images: keywords.map(kw => `suggestion_image_${kw}.jpg`),
      videos: keywords.map(kw => `suggestion_video_${kw}.mp4`),
      tags: keywords,
    };
  }

  private calculateSEOOptimization(content: string): SEOScore {
    // This is a simplified example. Real SEO would involve more complex analysis.
    const wordCount = content.split(/\s+/).length;
    const exampleKeyword = "inteligencia artificial"; // Example keyword
    const keywordOccurrences = (content.match(new RegExp(exampleKeyword, 'gi')) || []).length;

    return {
      readability: wordCount > 500 ? 0.8 : 0.5, // Placeholder
      keywordDensity: {
        [exampleKeyword]: keywordOccurrences / wordCount,
      },
      sentiment: "neutral", // Placeholder
    };
  }
}
