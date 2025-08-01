import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lyzcqbbfmgtxieytskrf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5emNxYmJmbWd0eGlleXRza3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NjM0NDQsImV4cCI6MjA2NTMzOTQ0NH0.54VVlT0nZwmqbAw9wHJeUYe0P-fEY54iY1SNZjTDeL8";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence to avoid localStorage issues
  },
  global: {
    headers: {
      'X-Client-Info': 'security-role-request-app'
    }
  }
});
