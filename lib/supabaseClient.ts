import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isProduction } from './config/production';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'x-application-name': 'mi-blog-tech'
      }
    }
  });
};

// Instancia singleton para producción
export const supabase = createClient();
