import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Groq } from "groq-sdk";
import { CohereClient } from "cohere-ai";
import { HfInference } from "@huggingface/inference";

export class AIClients {
  private googleAI: GoogleGenerativeAI;
  private openai: OpenAI;
  private groq: Groq;
  private cohere: CohereClient; // Correct type for Cohere
  private hf: HfInference;

  constructor() {
    // Validar que todas las API keys existen
    this.validateEnvironment();

    // Inicializar clients
    this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const cohereApiKey = process.env.COHERE_API_KEY;
    if (!cohereApiKey) throw new Error('Missing COHERE_API_KEY environment variable.');
    this.cohere = new CohereClient({ token: cohereApiKey }); // Instantiate CohereClient

    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
  }

  private validateEnvironment(): void {
    const required = {
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      COHERE_API_KEY: process.env.COHERE_API_KEY,
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    };

    const missing = Object.entries(required)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing API keys: ${missing.join(', ')}`);
    }
  }

  // Métodos de acceso con verificación
  getGoogleClient(): GoogleGenerativeAI {
    if (!this.googleAI) throw new Error('Google AI client not initialized');
    return this.googleAI;
  }

  getOpenAIClient(): OpenAI {
    if (!this.openai) throw new Error('OpenAI client not initialized');
    return this.openai;
  }

  getGroqClient(): Groq {
    if (!this.groq) throw new Error('Groq client not initialized');
    return this.groq;
  }

  getCohereClient(): CohereClient { // Correct return type
    if (!this.cohere) throw new Error('Cohere client not initialized');
    return this.cohere;
  }

  getHFClient(): HfInference {
    if (!this.hf) throw new Error('HuggingFace client not initialized');
    return this.hf;
  }

  // Validación de conexión
  validateApiKeys(): Record<string, boolean> {
    return {
      google: !!process.env.GOOGLE_AI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
    };
  }

  // Health check de todos los servicios
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    try {
      // Test Google AI
      const model = this.googleAI.getGenerativeModel({ model: "gemini-pro" });
      await model.generateContent("Test");
      results.google = true;
    } catch { results.google = false; }

    // Test OpenAI
    try {
      await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'gpt-3.5-turbo',
        max_tokens: 5,
      });
      results.openai = true;
    } catch { results.openai = false; }

    // Test Groq
    try {
      await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'llama3-8b-8192',
        max_tokens: 5,
      });
      results.groq = true;
    } catch { results.groq = false; }

    // Test Cohere
    try {
      await this.cohere.chat({ message: 'Test', model: 'command-r-plus', maxTokens: 5 });
      results.cohere = true;
    } catch { results.cohere = false; }

    // Test HuggingFace
    try {
      await this.hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: 'Test',
        parameters: { max_new_tokens: 5 }
      });
      results.huggingface = true;
    } catch { results.huggingface = false; }

    return results;
  }
}
