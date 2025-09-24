import Groq from 'groq-sdk';
import { CohereClient } from 'cohere-ai';

// --- Groq Client ---
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 30000, // 30 seconds timeout
});

export async function getGroqCompletion(messages: any[], model: string = 'llama3-8b-8192') {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set.');
  }
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Groq API failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Cohere Client ---
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function getCohereCompletion(prompt: string, model: string = 'command-r-plus') {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is not set.');
  }
  try {
    const response = await cohere.chat({
      message: prompt,
      model,
      temperature: 0.7,
    });
    return response.text;
  } catch (error) {
    console.error('Cohere API Error:', error);
    throw new Error(`Cohere API failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- HuggingFace Inference API Client ---
// For HuggingFace, we'll use a generic fetch wrapper for inference endpoints.
// The specific model and task will determine the endpoint and payload.
export async function getHuggingFaceInference(
  modelId: string,
  payload: any,
  options: RequestInit = {}
) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not set.');
  }

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    }
  );

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('HuggingFace API Error:', errorBody);
    throw new Error(
      `HuggingFace API failed for model ${modelId}: ${response.statusText} - ${JSON.stringify(errorBody)}`
    );
  }

  return response.json();
}
