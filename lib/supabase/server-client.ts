import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './supabase'; // Adjust path as needed

export const createServerClient = () => {
  return createRouteHandlerClient<Database>({ cookies });
};
