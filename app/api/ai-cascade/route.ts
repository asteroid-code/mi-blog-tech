import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🆓 PROVEEDORES GRATUITOS (desde tu multi_ai_route.ts)
const FREE_AI_PROVIDERS = [
  {
    name: 'groq-llama',
    enabled: !!process.env.GROQ_API_KEY,
    weight: 40,
    dailyLimit: 14400,
    model: 'llama-3.1-8b-instant'
  },
  {
    name: 'huggingface-gpt2',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    weight: 25,
    dailyLimit: 30000,
    model: 'gpt2-large'
  },
  {
    name: 'huggingface-t5',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    weight: 20,
    dailyLimit: 30000,
    model: 'google/flan-t5-large'
  },
  {
    name: 'cohere-free',
    enabled: !!process.env.COHERE_API_KEY,
    weight: 15,
    dailyLimit: 1000,
    model: 'command-light'
  }
];

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
  const postData = await generateFreeAIPost(topic);

  if (!postData) {
    throw new Error('No se pudo generar el contenido con IA');
  }

  return {
    title: postData.title,
    content: postData.content,
    ai_provider: postData.ai_provider,
    ai_model: postData.ai_model,
    word_count: postData.word_count
  };
}

// 🚀 FUNCIONES DE IA DESDE TU multi_ai_route.ts (COPIADAS DIRECTAMENTE)
function selectFreeAIProvider() {
  const availableProviders = FREE_AI_PROVIDERS.filter(p => p.enabled);

  if (availableProviders.length === 0) {
    throw new Error("⚠️ No hay proveedores GRATUITOS configurados. Configura al menos GROQ_API_KEY");
  }

  const totalWeight = availableProviders.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const provider of availableProviders) {
    random -= provider.weight;
    if (random <= 0) {
      return provider;
    }
  }

  return availableProviders[0];
}

async function generateWithGroq(topic: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'Eres AIFeed, un periodista experto en IA. Responde SIEMPRE con JSON válido.'
        },
        {
          role: 'user',
          content: createPrompt(topic)
        }
      ],
      max_tokens: 600,
      temperature: 0.8,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithHuggingFace(topic: string, model: string) {
  const modelEndpoint = model === 'gpt2-large' ?
    'https://api-inference.huggingface.co/models/gpt2-large' :
    'https://api-inference.huggingface.co/models/google/flan-t5-large';

  const response = await fetch(modelEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: createSimplifiedPrompt(topic),
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';
}

async function generateWithCohere(topic: string) {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-light',
      prompt: createPrompt(topic),
      max_tokens: 400,
      temperature: 0.8,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    })
  });

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`);
  }

  const data = await response.json();
  return data.generations[0].text;
}

function createPrompt(topic: string) {
  return `Crea un artículo sobre: "${topic}"

IMPORTANTE: Responde SOLO con un JSON válido en este formato exacto:

{
  "title": "Título atractivo de 8-12 palabras sobre ${topic}",
  "content": "Artículo completo de 120-180 palabras explicando ${topic} con detalles técnicos, tendencias actuales y desarrollo profesional pero accesible. Incluye introducción enganchadora, desarrollo principal y conclusión.",
  "category": "IA Avanzada",
  "source": "AIFeed Bot",
  "topic": "${topic}",
  "relevance_score": 8,
  "word_count": 150,
  "generated_at": "${new Date().toISOString()}"
}

Requisitos del contenido:
- Entre 120-180 palabras total
- Tono profesional pero accesible
- Incluye detalles técnicos específicos
- Enfócate en tendencias actuales
- NO uses fechas específicas recientes`;
}

function createSimplifiedPrompt(topic: string) {
  return `Escribe un artículo profesional sobre ${topic} en formato JSON:
{"title": "título de 8-12 palabras", "content": "artículo de 120-180 palabras con detalles técnicos", "category": "IA Avanzada", "relevance_score": 8}`;
}

async function generateFreeAIPost(topic: string) {
  const selectedProvider = selectFreeAIProvider();
  console.log(`🆓 Usando IA GRATUITA: ${selectedProvider.name}`);

  let response: string;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      switch (selectedProvider.name) {
        case 'groq-llama':
          response = await generateWithGroq(topic);
          break;
        case 'huggingface-gpt2':
        case 'huggingface-t5':
          response = await generateWithHuggingFace(topic, selectedProvider.model);
          break;
        case 'cohere-free':
          response = await generateWithCohere(topic);
          break;
        default:
          throw new Error(`Proveedor no soportado: ${selectedProvider.name}`);
      }

      let jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch && selectedProvider.name.includes('huggingface')) {
        const cleanResponse = response.replace(/.*inputs?:\s*"([^"]*)".*/, '$1').trim();
        const postData = {
          title: `${topic}: Nuevas Tendencias en IA`,
          content: cleanResponse.slice(0, 400) + " Esta tecnología está revolucionando el desarrollo de aplicaciones inteligentes.",
          category: "IA Avanzada",
          source: "AIFeed Bot",
          topic: topic,
          relevance_score: 7,
          word_count: cleanResponse.split(/\s+/).length,
          generated_at: new Date().toISOString(),
          ai_provider: selectedProvider.name,
          ai_model: selectedProvider.model
        };
        return postData;
      }

      if (jsonMatch) {
        const postData = JSON.parse(jsonMatch[0]);
        postData.ai_provider = selectedProvider.name;
        postData.ai_model = selectedProvider.model;

        if (!postData.content || postData.content.length < 100) {
          throw new Error("Contenido muy corto");
        }

        const wordCount = postData.content.split(/\s+/).length;
        postData.word_count = wordCount;

        if (wordCount < 80) {
          console.warn(`⚠️ Post corto: ${wordCount} palabras, reintentando...`);
          attempts++;
          continue;
        }

        return postData;
      }

      throw new Error("No se pudo extraer JSON de la respuesta");

    } catch (error) {
      attempts++;
      console.error(`❌ Intento ${attempts}/${maxAttempts} falló con ${selectedProvider.name}:`, error);

      if (attempts >= maxAttempts) {
        const fallbackProviders = FREE_AI_PROVIDERS.filter(p =>
          p.enabled && p.name !== selectedProvider.name
        );

        if (fallbackProviders.length > 0) {
          console.log(`🔄 Fallback a ${fallbackProviders[0].name}`);
          selectedProvider.name = fallbackProviders[0].name;
          selectedProvider.model = fallbackProviders[0].model;
          attempts = 0;
          continue;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }

  return null;
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