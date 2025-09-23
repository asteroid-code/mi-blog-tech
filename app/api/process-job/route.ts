import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN!;

// Tipo unificado para el resultado del procesamiento
type ProcessingResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export async function POST(request: NextRequest) {
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
              result: result.data
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

// 🔧 FUNCIONES DE PROCESAMIENTO (implementar después)
async function processScrapingJob(job: any): Promise<ProcessingResult> { // Especificar el tipo de retorno
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

async function processArticleGenerationJob(job: any): Promise<ProcessingResult> { // Especificar el tipo de retorno
  console.log(`🤖 Generando artículo con IA...`);
  // TODO: Implementar generación con IA
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulación

  return {
    success: true,
    data: {
      generated_content: "Artículo generado por IA simulado",
      word_count: 350,
      ai_model: "simulated"
    }
  };
}
