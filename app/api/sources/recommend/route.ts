import { NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabaseServer = await createClient(cookieStore);

  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Obtener contenido exitoso para analizar patrones
    const { data: successfulContent, error: contentError } = await supabaseServer
      .from('generated_content')
      .select('title, content, ai_provider, ai_model, original_content_id')
      .eq('status', 'published')
      .limit(10); // Limitar para análisis

    if (contentError) {
      console.error('Error fetching successful content:', contentError);
      return NextResponse.json({ success: false, error: contentError.message }, { status: 500 });
    }

    if (!successfulContent || successfulContent.length === 0) {
      return NextResponse.json({ success: true, message: 'No successful content to analyze for recommendations.' });
    }

    // 2. Extraer temas y palabras clave de contenido exitoso
    const topics = successfulContent.map((c: any) => c.title).join('. ');
    const prompt = `Analyze the following successful content titles and suggest 3 new, high-quality scraping source URLs that would provide similar valuable content. For each suggestion, also provide a brief reason, a suggested content_type (news, tutorial, opinion, image), and a quality_score (1-10). Format the output as a JSON array of objects with 'url', 'reason', 'content_type', and 'quality_score' fields.

Successful content titles: ${topics}

Example output:
[
  {
    "url": "https://example.com/tech-blog",
    "reason": "This blog consistently publishes in-depth tutorials on AI development.",
    "content_type": "tutorial",
    "quality_score": 9
  }
]
`;

    // 3. Usar AI Service para generar recomendaciones
    // TODO: Obtener el userId de la sesión del usuario o usar uno por defecto para tareas de sistema
    const userId = 'system-recommendation-bot';
    const aiResponse = await aiService.generateText(prompt, userId, 'structured');

    if (!aiResponse) {
      return NextResponse.json({ success: false, error: 'AI service failed to generate recommendations.' }, { status: 500 });
    }

    // 4. Parsear y devolver las recomendaciones
    let recommendations;
    try {
      // Intentar extraer el JSON de la respuesta de la IA
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response.");
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json({ success: false, error: 'Failed to parse AI recommendations.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendations });

  } catch (error) {
    console.error('Error in source recommendation API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
