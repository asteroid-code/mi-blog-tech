const { ContentGenerator } = require('../lib/ai/contentGenerator');
const { AIClients } = require('../lib/ai/clients'); // Import AIClients

async function fullTest() {
  console.log('🧪 INICIANDO PRUEBA COMPLETA DEL SISTEMA DE IA\n');

  try {
    const aiClients = new AIClients(); // Instantiate AIClients
    const generator = new ContentGenerator(aiClients); // Pass AIClients to constructor

    const result = await generator.generateMultimediaContent(
      'React vs Vue: Comparativa en 2024',
      'Frontend'
    );

    console.log('✅ GENERACIÓN EXITOSA!');
    console.log('Título:', result.title);
    console.log('Resumen:', result.summary);
    console.log('Palabras:', result.word_count);
    console.log('Etiquetas:', result.tags);
    console.log('Imágenes sugeridas:', result.image_descriptions.length);
    console.log('Videos sugeridos:', result.video_suggestions.length);

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.error(error); // Log full error for debugging
  }
}

fullTest();
