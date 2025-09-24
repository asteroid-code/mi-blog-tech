import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Validación estricta de variables de entorno
const validateEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(`
      ❌ Variables de entorno faltantes:
      - NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅' : '❌'}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✅' : '❌'}

      Verifica tu archivo .env.local
    `);
  }

  return { url, key };
};

const { url, key } = validateEnv();

console.log('🔗 Creando cliente Supabase...');
console.log('   URL:', url.substring(0, 30) + '...');
console.log('   Key:', key.substring(0, 10) + '...');

export const supabase = createSupabaseClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Test de conexión inmediato
supabase.from('scraping_sources').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('❌ Error de conexión Supabase:', error.message);
    } else {
      console.log('✅ Conexión Supabase verificada');
    }
  });
