import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { performScraping } from '@/lib/cron/scrapingScheduler'; // Importar la función de scraping

export async function POST() {
  try {
    console.log('Manual scrape trigger received.');

    // Obtener una fuente activa para el scraping manual
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
