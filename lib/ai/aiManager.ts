import { AIClients } from './clients';
import { GeneratedContent } from '@/types/ai';

export type AIProviderName = 'openai' | 'google' | 'cohere' | 'huggingface' | 'groq';

export interface AIProvider {
  generateContent(prompt: string, options?: any): Promise<GeneratedContent>;
  // Add other common AI operations here
}

import { OpenAIProvider, GoogleAIProvider, GroqProvider, CohereProvider, HuggingFaceProvider } from './providers';

export class AIManager {
  private clients: AIClients;
  private providers: Map<AIProviderName, AIProvider>;

  constructor() {
    this.clients = new AIClients();
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    const clients = this.clients;
    if (clients.validateApiKeys().openai) {
      this.providers.set('openai', new OpenAIProvider(clients));
    }
    if (clients.validateApiKeys().google) {
      this.providers.set('google', new GoogleAIProvider(clients));
    }
    if (clients.validateApiKeys().groq) {
      this.providers.set('groq', new GroqProvider(clients));
    }
    if (clients.validateApiKeys().cohere) {
      this.providers.set('cohere', new CohereProvider(clients));
    }
    if (clients.validateApiKeys().huggingface) {
      this.providers.set('huggingface', new HuggingFaceProvider(clients));
    }
  }

  public getProvider(name: AIProviderName): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider "${name}" not found or not initialized.`);
    }
    return provider;
  }

  public async generateContent(providerName: AIProviderName, prompt: string, options?: any): Promise<GeneratedContent> {
    const provider = this.getProvider(providerName);
    return provider.generateContent(prompt, options);
  }

  // Method to dynamically select a provider based on availability or other criteria
  public getPreferredProvider(): AIProviderName {
    const availableClients = this.clients.validateApiKeys();
    if (availableClients.openai) return 'openai';
    if (availableClients.google) return 'google';
    if (availableClients.groq) return 'groq';
    if (availableClients.cohere) return 'cohere';
    if (availableClients.huggingface) return 'huggingface';
    throw new Error('No AI provider API keys configured.');
  }
}
