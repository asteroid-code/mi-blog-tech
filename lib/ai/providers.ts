import { AIProvider } from './aiManager';
import { GeneratedContent } from '@/types/ai';
import { AIClients } from './clients';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import Cohere from 'cohere-ai';
import { HfInference } from '@huggingface/inference';

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(clients: AIClients) {
    this.client = clients.getOpenAIClient();
  }

  async generateContent(prompt: string, options?: any): Promise<GeneratedContent> {
    const chatCompletion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || 'gpt-4o',
      ...options,
    });

    const content = chatCompletion.choices[0].message.content || '';
    // This is a simplified parsing. In a real scenario, you'd want a more robust way to extract structured data.
    return {
      title: content.split('\n')[0] || 'Generated Title',
      content: content,
      summary: content.substring(0, 150) + '...',
      image_descriptions: [],
      video_suggestions: [],
      tags: [],
      reading_time: Math.ceil(content.split(' ').length / 200), // ~200 words per minute
      word_count: content.split(' ').length,
    };
  }
}

// Google AI Provider
export class GoogleAIProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(clients: AIClients) {
    this.client = clients.getGoogleClient();
  }

  async generateContent(prompt: string, options?: any): Promise<GeneratedContent> {
    const model = this.client.getGenerativeModel({ model: options?.model || 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text() || '';

    return {
      title: content.split('\n')[0] || 'Generated Title',
      content: content,
      summary: content.substring(0, 150) + '...',
      image_descriptions: [],
      video_suggestions: [],
      tags: [],
      reading_time: Math.ceil(content.split(' ').length / 200),
      word_count: content.split(' ').length,
    };
  }
}

// Groq Provider
export class GroqProvider implements AIProvider {
  private client: Groq;

  constructor(clients: AIClients) {
    this.client = clients.getGroqClient();
  }

  async generateContent(prompt: string, options?: any): Promise<GeneratedContent> {
    const chatCompletion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || 'llama3-8b-8192', // Default Groq model
      ...options,
    });

    const content = chatCompletion.choices[0].message.content || '';
    return {
      title: content.split('\n')[0] || 'Generated Title',
      content: content,
      summary: content.substring(0, 150) + '...',
      image_descriptions: [],
      video_suggestions: [],
      tags: [],
      reading_time: Math.ceil(content.split(' ').length / 200),
      word_count: content.split(' ').length,
    };
  }
}

// Cohere Provider
export class CohereProvider implements AIProvider {
  private client: any; // Use 'any' for now due to SDK typing issues

  constructor(clients: AIClients) {
    this.client = clients.getCohereClient();
  }

  async generateContent(prompt: string, options?: any): Promise<GeneratedContent> {
    // Cohere's SDK might require a different way to call generate,
    // or the 'Cohere' object itself might be an instance.
    // Assuming `this.client` is already initialized and has a `generate` method.
    const response = await this.client.generate({
      prompt: prompt,
      model: options?.model || 'command-r-plus', // Default Cohere model
      ...options,
    });

    const content = response.generations[0].text || '';
    return {
      title: content.split('\n')[0] || 'Generated Title',
      content: content,
      summary: content.substring(0, 150) + '...',
      image_descriptions: [],
      video_suggestions: [],
      tags: [],
      reading_time: Math.ceil(content.split(' ').length / 200),
      word_count: content.split(' ').length,
    };
  }
}

// HuggingFace Provider
export class HuggingFaceProvider implements AIProvider {
  private client: HfInference;

  constructor(clients: AIClients) {
    this.client = clients.getHFClient();
  }

  async generateContent(prompt: string, options?: any): Promise<GeneratedContent> {
    // HuggingFace has many models and tasks. This is a generic text generation example.
    // You might need to adapt this based on the specific HF model and task you intend to use.
    const response = await this.client.textGeneration({
      model: options?.model || 'gpt2', // Default HF model for text generation
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        ...options?.parameters,
      },
    });

    const content = response.generated_text || '';
    return {
      title: content.split('\n')[0] || 'Generated Title',
      content: content,
      summary: content.substring(0, 150) + '...',
      image_descriptions: [],
      video_suggestions: [],
      tags: [],
      reading_time: Math.ceil(content.split(' ').length / 200),
      word_count: content.split(' ').length,
    };
  }
}
