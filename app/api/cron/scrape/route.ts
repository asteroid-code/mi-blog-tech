import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { performScraping } from '@/lib/cron/scrapingScheduler'; // Importar la función de scraping

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea estáticamente optimizada


export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('Manual scrape trigger received.');

    // Obtener una fuente activa para el scraping manual
    const supabase = await createClient();
    const { data: source, error: fetchError } = await supabase
      .from('scraping_sources')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ success: false, message: 'No active source found for manual scraping.' }, { status: 404 });
    }

    await performScraping(source);

    return NextResponse.json({ success: true, message: `Scraping triggered for source: ${source.name}` });
  } catch (error) {
    console.error('Error triggering manual scrape:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
