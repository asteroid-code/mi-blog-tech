// scripts/test_start_scraping.js
require('dotenv').config({ path: '.env.local' });

async function testStartScraping() {
  const API_URL = 'http://localhost:3000/api/start-scraping';
  const API_TOKEN = process.env.API_SECRET_TOKEN;
  const ADMIN_ID = process.env.ADMIN_USER_ID_FOR_TESTING; // Usamos una variable separada

  if (!API_TOKEN || !ADMIN_ID) {
    console.error('Error: Asegúrate de tener API_SECRET_TOKEN y ADMIN_USER_ID_FOR_TESTING en tu .env.local');
    return;
  }

  console.log('🚀 Llamando a la API para iniciar trabajos de scraping...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: ADMIN_ID,
        jobType: 'scrape_url',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'La petición a la API falló');
    }

    console.log('✅ ¡Éxito! Respuesta de la API:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Falló el script de prueba:', error);
  }
}

testStartScraping();
