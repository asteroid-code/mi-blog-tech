import { createClient } from '../lib/supabaseClient.ts';
import { ScrapingSource } from '../types/scraping';

async function checkDatabase() {
  console.log('🧪 Verificando conexión a base de datos...\n');

  try {
    const supabase = createClient();

    const { data, error, count } = await supabase
      .from('scraping_sources')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (error) throw error;

    console.log('✅ Conexión exitosa');
    console.log(`📊 Fuentes activas encontradas: ${count}`);
    console.log('📋 Fuentes:');
    data?.forEach((source: ScrapingSource, index: number) => {
      console.log(`   ${index + 1}. ${source.name} (${source.url})`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
