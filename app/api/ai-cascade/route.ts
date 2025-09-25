import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface OriginalContent {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  scraped_at: string;
  created_at: string;
}

interface AIAnalysisResult {
  topic: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  imagePrompts: string[];
}

async function analyzeWithAI(originalContent: OriginalContent): Promise<AIAnalysisResult> {
  const prompt = `Actúa como un Analista de Contenido experto. Tu tarea es leer el siguiente texto y extraer un análisis rico en formato JSON.
  El análisis debe incluir:
  1. El tema principal del artículo ('topic').
  2. Un array con las 3 a 5 ideas más importantes del texto ('keyPoints').
  3. El sentimiento general del texto ('sentiment': 'positivo', 'neutro', o 'negativo').
  4. Un array de 3 strings ('imagePrompts'). Cada string debe ser una descripción detallada y visual para generar una imagen que ilustre uno de los puntos clave del artículo. Estas descripciones deben ser prompts efectivos para una IA de generación de imágenes como DALL-E 3.

  Asegúrate de que la salida sea un objeto JSON válido y nada más.

  Contenido a analizar:
  "${originalContent.content}"`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant', // Using Llama 3.1 for speed and cost-effectiveness
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('AI did not return any content.');
    }

    const analysis: AIAnalysisResult = JSON.parse(responseContent);
    return analysis;

  } catch (error) {
    console.error('Error calling Groq API for analysis:', error);
    throw new Error(`Failed to analyze content with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { original_content } = await request.json();

    if (!original_content) {
      return NextResponse.json({ error: 'Missing original_content in request body' }, { status: 400 });
    }

    const analysisResult = await analyzeWithAI(original_content);

    return NextResponse.json({ success: true, analysis: analysisResult }, { status: 200 });
  } catch (error) {
    console.error('Error in AI cascade route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
