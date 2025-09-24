const { ScraperManager2025 } = require('../lib/automation/scraperManager');
const { createClient } = require('../lib/supabaseClient'); // Assuming supabaseClient is a commonJS module

async function testCompleteSystem() {
  console.log('🚀 INICIANDO PRUEBA COMPLETA DEL SISTEMA\n');

  try {
    const supabase = createClient();
    const scraperManager = new ScraperManager2025();

    // Test 1: Scraper básico
    console.log('1. Probando scraper RSS...');
    const testUrl = 'https://openai.com/blog/rss/';
    const scrapedItems = await scraperManager['rssScraper'].scrapeFeed(testUrl);
    if (scrapedItems.length > 0) {
      console.log(`   ✅ Scraper RSS encontró ${scrapedItems.length} artículos. Primer artículo: "${scrapedItems[0].title}"`);
    } else {
      console.log('   ❌ Scraper RSS no encontró artículos.');
      process.exit(1);
    }

    // Test 2: Integración con IA
    console.log('2. Probando procesamiento IA...');
    if (scrapedItems.length > 0) {
      const testItem = scrapedItems[0];
      try {
        const aiProcessingResult = await scraperManager['contentProcessor'].processWithAITrends(testItem);
        if (aiProcessingResult && aiProcessingResult.ai_trends && aiProcessingResult.ai_trends.length > 0) {
          console.log(`   ✅ Procesamiento IA exitoso. Tendencias encontradas: ${aiProcessingResult.ai_trends.join(', ')}`);
        } else {
          console.log('   ⚠ Procesamiento IA completado, pero no se encontraron tendencias.');
        }
      } catch (aiError) {
        console.log(`   ❌ Error en procesamiento IA: ${aiError.message}`);
        process.exit(1);
      }
    } else {
      console.log('   ⚠ No hay artículos para probar el procesamiento IA.');
    }

    // Test 3: Base de datos
    console.log('3. Probando conexión BD...');
    try {
      const { count: beforeCount, error: dbError } = await supabase
        .from('original_content')
        .select('*', { count: 'exact', head: true });

      if (dbError) {
        throw new Error(dbError.message);
      }
      console.log(`   ✅ Conexión a la base de datos exitosa. Artículos existentes: ${beforeCount}`);
    } catch (dbError) {
      console.log(`   ❌ Error al conectar o consultar la base de datos: ${dbError.message}`);
      process.exit(1);
    }

    console.log('\n✅ SISTEMA COMPLETO FUNCIONANDO CORRECTAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR EN EL SISTEMA:', error.message);
    process.exit(1);
  }
}

testCompleteSystem();
