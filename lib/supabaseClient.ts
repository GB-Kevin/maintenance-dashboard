import { createClient } from '@supabase/supabase-js';


// Initialize the Supabase client with your project URL and anon key.
// These values must be provided via environment variables. See `.env.example`.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
