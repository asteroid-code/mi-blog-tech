import { createClient } from '@/lib/supabase/server';
import { contentOrchestrator } from '../contentOrchestrator'; // Para disparar el procesamiento

interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  selector?: string;
  is_active: boolean;
  scraping_frequency: number; // Frecuencia en horas
  last_scraped_at?: string;
}

const activeSchedulers: { [sourceId: string]: NodeJS.Timeout } = {};

/**
 * Inicia el programador de scraping para todas las fuentes activas.
 */
export async function startScrapingScheduler(): Promise<void> {
  console.log('Initializing scraping scheduler...');
  await loadAndScheduleSources();
  // Opcional: Re-evaluar fuentes periódicamente para nuevas adiciones/cambios
  setInterval(loadAndScheduleSources, 60 * 60 * 1000); // Cada hora, revisar fuentes
}

/**
 * Carga las fuentes de la base de datos y programa el scraping.
 */
async function loadAndScheduleSources(): Promise<void> {
  console.log('Loading scraping sources from database...');
  const supabase = await createClient();
  const { data: sources, error } = await supabase
    .from('scraping_sources')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading scraping sources:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('No active scraping sources found.');
    // Limpiar cualquier programador activo si no hay fuentes
    for (const sourceId in activeSchedulers) {
      clearInterval(activeSchedulers[sourceId]);
      delete activeSchedulers[sourceId];
    }
    return;
  }

  for (const source of sources) {
    // Si la fuente ya tiene un programador activo, lo limpiamos para re-programar
    if (activeSchedulers[source.id]) {
      clearInterval(activeSchedulers[source.id]);
      delete activeSchedulers[source.id];
    }

    // Calcular el tiempo hasta la próxima ejecución
    const now = new Date();
    const lastScraped = source.last_scraped_at ? new Date(source.last_scraped_at) : new Date(0); // Si nunca se ha scrapeado, lo hacemos inmediatamente
    const frequencyMs = source.scraping_frequency * 60 * 60 * 1000; // Convertir horas a ms

    let timeUntilNextScrape = frequencyMs - (now.getTime() - lastScraped.getTime());
    if (timeUntilNextScrape < 0) {
      timeUntilNextScrape = 0; // Scrapear inmediatamente si ya pasó el tiempo
    }

    console.log(`Scheduling source "${source.name}" (ID: ${source.id}) to scrape in ${timeUntilNextScrape / 1000} seconds.`);

    activeSchedulers[source.id] = setTimeout(async () => {
      await performScraping(source);
      // Una vez scrapeado, reprogramar para la próxima frecuencia
      activeSchedulers[source.id] = setInterval(() => performScraping(source), frequencyMs);
    }, timeUntilNextScrape);
  }
  console.log(`Scraping scheduled for ${sources.length} sources.`);
}

/**
 * Realiza la acción de scraping para una fuente específica.
 */
export async function performScraping(source: ScrapingSource): Promise<void> {
  console.log(`⚙️ Iniciando scraping para: "${source.name}" (URL: ${source.url})`);
  try {
    // Aquí iría la lógica real de scraping.
    // Por ahora, simulamos el scraping y guardamos en original_content.
    const scrapedContent = {
      title: `Contenido de ${source.name} - ${new Date().toLocaleString()}`,
      content: `Este es un contenido simulado scrapeado de ${source.url}. Selector: ${source.selector || 'N/A'}.`,
      url: source.url,
      source_id: source.id,
      is_processed: false,
      created_at: new Date().toISOString(),
    };

    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from('original_content')
      .insert([scrapedContent]);

    if (insertError) {
      console.error(`Error saving scraped content for ${source.name}:`, insertError);
      await updateSourceSuccessRate(source.id, false);
    } else {
      console.log(`✅ Contenido scrapeado de "${source.name}" guardado.`);
      await updateSourceSuccessRate(source.id, true);
      // Disparar el procesamiento de este nuevo contenido
      await contentOrchestrator.processNewContent();
    }

    // Actualizar last_scraped_at
    await supabase
      .from('scraping_sources')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', source.id);

  } catch (error) {
    console.error(`❌ Error durante el scraping de "${source.name}":`, error);
    await updateSourceSuccessRate(source.id, false);
  }
}

/**
 * Actualiza la tasa de éxito de una fuente.
 */
async function updateSourceSuccessRate(sourceId: string, success: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: source, error: fetchError } = await supabase
    .from('scraping_sources')
    .select('last_success_rate')
    .eq('id', sourceId)
    .single();

  if (fetchError || !source) {
    console.error(`Error fetching source ${sourceId} for success rate update:`, fetchError);
    return;
  }

  let currentRate = source.last_success_rate;
  // Simple moving average or direct update
  const newRate = success ? (currentRate * 0.9 + 100 * 0.1) : (currentRate * 0.9 + 0 * 0.1);

  const { error: updateError } = await supabase
    .from('scraping_sources')
    .update({ last_success_rate: newRate })
    .eq('id', sourceId);

  if (updateError) {
    console.error(`Error updating success rate for source ${sourceId}:`, updateError);
  }
}
