import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Missing Supabase environment variables. Please check your .env.local file'
  );
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

// Exportación alternativa para uso directo
export const supabase = createClient();
