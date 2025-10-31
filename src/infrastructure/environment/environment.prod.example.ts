// Copy this file to environment.prod.ts and fill in your environment variables
// Get your Supabase credentials from: https://supabase.com/dashboard
export const environment = {
  production: true,
  supabase: {
    url: '', // Your Supabase project URL (from .env: SUPABASE_URL)
    anonKey: '' // Your Supabase anon key (from .env: SUPABASE_ANON_KEY)
  }
};
