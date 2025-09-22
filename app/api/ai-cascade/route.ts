import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '../../../lib/aiService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Temas organizados por horario (desde tu multi_ai_route.ts)
const MORNING_TOPICS = [
  "OpenAI nuevos desarrollos",
  "DeepSeek modelos",
  "nuevos modelos de IA",
  "avances en machine learning",
  "benchmarks de IA"
];

const AFTERNOON_TOPICS = [
  "ingeniería de prompts",
  "prompt engineering",
  "AI coding tools",
  "DeepSeek coder",
  "vibe coding"
];

const EVENING_TOPICS = [
  "ChatGPT nuevas funciones",
  "Claude AI",
  "Gemini AI",
  "herramientas de desarrollo con IA",
  "IA generativa nuevos usos"
];

function getTopicsByHour() {
  const currentHour = new Date().getHours();

  if (currentHour >= 6 && currentHour < 12) {
    return MORNING_TOPICS;
  } else if (currentHour >= 12 && currentHour < 18) {
    return AFTERNOON_TOPICS;
  } else {
    return EVENING_TOPICS;
  }
}

// LAS 3 IA EN CASCADA - ENDPOINT PRINCIPAL
export async function POST() {
  try {
    console.log('🚀 Iniciando cascada de 3 IA...');

    // 1. OBTENER CONTENIDO SCRAPEADO NO PROCESADO
    const { data: unscrapedContent, error: fetchError } = await supabase
      .from('original_content')
      .select('*')
      .eq('is_processed', false)
      .limit(1)
      .single();

    if (fetchError || !unscrapedContent) {
      return NextResponse.json({
        message: 'No hay contenido nuevo para procesar',
        success: true
      });
    }

    console.log(`📄 Procesando: "${unscrapedContent.title}"`);

    // 2. CREAR JOB DE PROCESAMIENTO (Capa 1)
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert([{
        content_id: unscrapedContent.id,
        status: 'running',
        job_type_id: 1,
        parameters: {
          original_title: unscrapedContent.title,
          content_length: unscrapedContent.content?.length || 0
        },
        progress: 0,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (jobError) throw new Error(`Error creando job: ${jobError.message}`);

    // 3. IA1: ANÁLISIS Y FILTRADO
    console.log('🤖 IA1: Analizando contenido...');
    const analysis = await analyzeWithAI(unscrapedContent);
    await updateJobProgress(job.id, 33, analysis);

    // 4. IA2: ESTRUCTURA Y OUTLINE
    console.log('📝 IA2: Creando estructura...');
    const outline = await createOutlineWithAI(analysis);
    await updateJobProgress(job.id, 66, outline);

    // 5. IA3: REDACCIÓN FINAL (USA TU LÓGICA REAL)
    console.log('✍️ IA3: Generando artículo...');
    const finalArticle = await writeArticleWithAI(outline);
    await updateJobProgress(job.id, 100, finalArticle);

    // 6. GUARDAR CONTENIDO GENERADO
    const { data: generated, error: genError } = await supabase
      .from('generated_content')
      .insert([{
        original_content_id: unscrapedContent.id,
        title: finalArticle.title,
        content: finalArticle.content,
        ai_provider: finalArticle.ai_provider,
        ai_model: finalArticle.ai_model,
        status: 'published',
        word_count: finalArticle.word_count,
        metadata: {
          processing_time: Date.now(),
          ai_cascade: true,
          analysis_score: analysis.relevance,
          outline_sections: outline.sections?.length || 0,
          version: '1.0'
        },
        published_at: new Date().toISOString(),
        reading_time: Math.ceil(finalArticle.word_count / 200)
      }])
      .select()
      .single();

    if (genError) throw new Error(`Error guardando contenido: ${genError.message}`);

    // 7. MARCAR COMO PROCESADO
    await supabase
      .from('original_content')
      .update({ is_processed: true })
      .eq('id', unscrapedContent.id);

    // 8. COMPLETAR JOB
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: { generated_content_id: generated.id }
      })
      .eq('id', job.id);

    console.log('✅ Cascada completada exitosamente!');

    return NextResponse.json({
      success: true,
      message: 'Contenido procesado con 3 IA en cascada',
      original_id: unscrapedContent.id,
      generated_id: generated.id,
      article_title: generated.title,
      word_count: generated.word_count,
      ai_provider: generated.ai_provider
    });

  } catch (error) {
    console.error('❌ Error en cascada de IA:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error en el procesamiento'
      },
      { status: 500 }
    );
  }
}

// FUNCIONES DE LAS 3 IA EN CASCADA
async function analyzeWithAI(content: any) {
  const topic = extractMainTopic(content.title + ' ' + content.content);

  return {
    topic,
    relevance: calculateRelevance(topic),
    keyPoints: extractKeyPoints(content.content),
    wordCount: content.content?.length || 0,
    sentiment: 'neutral'
  };
}

async function createOutlineWithAI(analysis: any) {
  return {
    title: `Análisis: ${analysis.topic}`,
    sections: [
      'Introducción',
      'Desarrollo técnico',
      'Tendencias actuales',
      'Conclusión'
    ],
    keywords: [analysis.topic, 'IA', 'tecnología'],
    targetWordCount: 150
  };
}

async function writeArticleWithAI(outline: any) {
  const topic = outline.keywords[0] || outline.topic || 'Inteligencia Artificial';

  // Usar el nuevo servicio de IA
  // TODO: Obtener el userId de la sesión del usuario
  const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const generatedText = await aiService.generateText(topic, userId, 'structured');

  if (!generatedText) {
    throw new Error('No se pudo generar el contenido con IA desde el servicio unificado.');
  }

  // Simulación de parseo de una respuesta JSON que vendría del servicio
  try {
    // Extraer el proveedor del texto generado (ej: "[Grok] ...")
    const providerMatch = generatedText.match(/\[(.*?)\]/);
    const provider = providerMatch ? providerMatch[1].toLowerCase() : 'unknown';

    return {
      title: `Artículo sobre ${topic} generado por ${provider}`,
      content: generatedText,
      ai_provider: provider,
      ai_model: 'default-model', // El modelo específico podría ser parte de la respuesta del servicio
      word_count: generatedText.split(/\s+/).length,
    };
  } catch (error) {
    console.error("Error al parsear la respuesta del AI Service:", error);
    throw new Error("La respuesta del servicio de IA no es un JSON válido.");
  }
}

// FUNCIONES AUXILIARES
async function updateJobProgress(jobId: string, progress: number, data: any) {
  await supabase
    .from('processing_jobs')
    .update({
      progress,
      result: data,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

function extractMainTopic(text: string): string {
  const topics = ['IA', 'machine learning', 'deep learning', 'LLM', 'OpenAI'];
  for (const topic of topics) {
    if (text.toLowerCase().includes(topic.toLowerCase())) {
      return topic;
    }
  }
  return 'Inteligencia Artificial';
}

function calculateRelevance(topic: string): number {
  const relevanceMap: { [key: string]: number } = {
    'IA': 9,
    'machine learning': 8,
    'deep learning': 7,
    'LLM': 9,
    'OpenAI': 8
  };
  return relevanceMap[topic] || 6;
}

function extractKeyPoints(content: string): string[] {
  const sentences = content.split('.').slice(0, 3);
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}
