 import { NextResponse } from "next/server";
    import { createClient } from '@supabase/supabase-js';

    // Creamos el cliente de Supabase con la llave maestra para poder leer y escribir
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Nuestra API aceptará peticiones POST
    export async function POST() {
      try {
        console.log("Buscando un nuevo trabajo de procesamiento...");

        // 1. BUSCAR UN TRABAJO PENDIENTE
        //    Buscamos en `processing_jobs` una tarea que esté 'pendiente'
        //    y que sea de tipo 'generate_article_from_original'.
        const { data: job, error: jobError } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('status', 'pending')
          .eq('job_type', 'generate_article_from_original') // <-- Revisa si este es el nombre que quieres usar
          .limit(1)
          .single();

        if (jobError || !job) {
          console.log("No se encontraron trabajos pendientes.");
          return NextResponse.json({ message: "No jobs to process." });
        }

        console.log(`Trabajo encontrado con ID: ${job.id}. Procesando...`);

        // --- PRÓXIMOS PASOS (LOS HAREMOS LUEGO) ---
        // 2. LEER el contenido original asociado a este trabajo.
        // 3. ENVIAR el contenido a la IA.
        // 4. GUARDAR el resultado en `generated_content`.
        // 5. ACTUALIZAR el estado del trabajo a 'completed'.
        // ---------------------------------------------

        // Por ahora, solo devolvemos el trabajo que encontramos
        return NextResponse.json({
          success: true,
          message: "Job found, processing will be implemented next.",
          jobData: job
        });

      } catch (error) {
        console.error("Error en la API de procesamiento:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
      }
    }