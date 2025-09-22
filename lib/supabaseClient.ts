    import { createClient } from '@supabase/supabase-js'

    // Lee las variables de entorno para el front-end
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Crea y exporta el cliente de Supabase
    export const supabase = createClient(supabaseUrl, supabaseAnonKey)