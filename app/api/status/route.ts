import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = createClient();

    // Verificar conexión a BD
    const { data: posts, count, error: dbError } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact' })
      .limit(1);

    // Verificar API Keys
    const aiKeys = {
      google: !!process.env.GOOGLE_AI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
    };

    return NextResponse.json({
      status: 'Sistema de Blog Automatizado',
      database: {
        connected: !dbError,
        posts_count: count || 0,
        has_data: (posts && posts.length > 0) || false,
        error: dbError?.message || null
      },
      ai_apis: aiKeys,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      next_steps: 'Sistema listo para pruebas de generación de contenido'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Error en sistema',
      error: error.message
    }, { status: 500 });
  }
}
