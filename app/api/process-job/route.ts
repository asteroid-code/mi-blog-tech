import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabaseClient'; // Use our custom Supabase client
import { ContentGenerator, GeneratedContent } from '@/lib/ai/contentGenerator'; // Removed OriginalContent, added GeneratedContent
import { AIClients } from '@/lib/ai/clients';

const supabase = createClient(); // Initialize Supabase client
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN!;

// Tipo unificado para el resultado del procesamiento
type ProcessingResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export async function POST(request: NextRequest) {
  // Solo habilitar en desarrollo
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_IA) {
    return NextResponse.json({ error: 'IA disabled in production' }, { status: 403 });
  }

  try {
    // 🔐 Validar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔍 Buscando trabajos pendientes...");

    // 1. BUSCAR TRABAJOS PENDIENTES con JOIN a job_types
    const { data: jobs, error: jobsError } = await supabase
      .from('processing_jobs')
      .select(`
        *,
        job_types(name),
        scraping_sources(name, url)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5); // Procesar hasta 5 jobs a la vez

    if (jobsError) {
      console.error("Error buscando jobs:", jobsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log("✅ No hay trabajos pendientes.");
      return NextResponse.json({
        success: true,
        message: "No pending jobs to process.",
        processed: 0
      });
    }

    console.log(`🎯 Encontrados ${jobs.length} trabajos pendientes.`);

    const results = [];

    // 2. PROCESAR CADA JOB
    for (const job of jobs) {
      try {
        console.log(`🔄 Procesando job ${job.id} (${job.job_types?.name})...`);

        // Actualizar status a 'running'
        await supabase
          .from('processing_jobs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
            progress: 10
          })
          .eq('id', job.id);

        // 3. EJECUTAR SCRAPING SEGÚN EL TIPO DE TRABAJO
        let result: ProcessingResult; // Especificar el tipo de 'result'
        if (job.job_types?.name === 'scraping') {
          result = await processScrapingJob(job);
        } else if (job.job_types?.name === 'generate_article_from_original') {
          result = await processArticleGenerationJob(job);
        } else {
          result = { success: false, error: 'Unknown job type' };
        }

        // 4. ACTUALIZAR RESULTADO
        if (result.success) {
          await supabase
            .from('processing_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              progress: 100,
              result: result.data // Store the ID of the generated content
            })
            .eq('id', job.id);

          console.log(`✅ Job ${job.id} completado exitosamente.`);
        } else if (!result.success && result.error) { // Corregir la verificación de error
          await supabase
            .from('processing_jobs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: result.error
            })
            .eq('id', job.id);

          console.error(`❌ Job ${job.id} falló:`, result.error);
        }

        results.push({
          jobId: job.id,
          type: job.job_types?.name,
          success: result.success,
          source: job.scraping_sources?.name
        });

      } catch (jobError) {
        console.error(`💥 Error procesando job ${job.id}:`, jobError);

        await supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: jobError instanceof Error ? jobError.message : 'Unknown error'
          })
          .eq('id', job.id);

        results.push({
          jobId: job.id,
          success: false,
          error: 'Processing error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${jobs.length} jobs`,
      processed: jobs.length,
      results: results
    });

  } catch (error) {
    console.error("💥 Error en el worker:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔧 FUNCIONES DE PROCESAMIENTO
async function processScrapingJob(job: any): Promise<ProcessingResult> {
  console.log(`🌐 Ejecutando scraping para: ${job.scraping_sources?.url}`);
  // TODO: Implementar scraping real con Puppeteer/Playwright
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación

  return {
    success: true,
    data: {
      scraped_data: "Contenido scraped simulado",
      items_found: 5,
      execution_time: "2s"
    }
  };
}

async function processArticleGenerationJob(job: any): Promise<ProcessingResult> {
  console.log(`🤖 Generando artículo con IA para job ${job.id}...`);
  const originalContentId = job.original_content_id; // Assuming job has original_content_id
  if (!originalContentId) {
    console.error(`Error: original_content_id is missing for job ${job.id}.`);
    return { success: false, error: 'Missing original_content_id for article generation.' };
  }

  try {
    // Fetch the original content
    const { data: originalContentData, error: originalContentError } = await supabase
      .from('original_content')
      .select('*')
      .eq('id', originalContentId)
      .single();

    if (originalContentError || !originalContentData) {
      console.error(`Error fetching original content for job ${job.id}:`, originalContentError?.message || 'Not found');
      return { success: false, error: `Original content not found for ID: ${originalContentId}` };
    }

    // We no longer need to cast to OriginalContent as it's not exported
    // The ContentGenerator constructor no longer takes AIClients
    const contentGenerator = new ContentGenerator(); // Instantiate without AIClients

    // Generate content using the original content's title
    const generatedContent: GeneratedContent = await contentGenerator.generateMultimediaContent(originalContentData.title);

    // Save the generated content to the 'generated_content' table
    const { data: newContent, error: insertError } = await supabase
      .from('generated_content')
      .insert([
        {
          original_content_id: originalContentId,
          title: generatedContent.title,
          summary: generatedContent.summary,
          content: generatedContent.content,
          image_url: generatedContent.image_descriptions[0] || '', // Use first image description as URL
          post_type: 'article', // Default to article
          category_id: job.metadata?.category_id || 'default-category-id', // Assuming category_id is in job metadata
          tags: generatedContent.tags,
          word_count: generatedContent.word_count,
          reading_time: generatedContent.reading_time,
          // Add other fields as necessary
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error(`Error inserting generated content for job ${job.id}:`, insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`✅ Contenido generado e insertado para job ${job.id}. New content ID: ${newContent.id}`);

    return {
      success: true,
      data: {
        generated_content_id: newContent.id,
        title: newContent.title,
        summary: newContent.summary,
        image_url: newContent.image_url,
        post_type: newContent.post_type,
        category_id: newContent.category_id,
      }
    };

  } catch (error) {
    console.error(`Error generating article for job ${job.id}:`, error);
    return {
      success: false,
      error: `AI content generation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
