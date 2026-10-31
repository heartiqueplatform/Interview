import { createClient } from '@supabase/supabase-js';

export const getSupabaseServer = () => {
  const url = process.env.VITE_SUPABASE_URL || 'https://kvrktfhynrdzzyctxkdo.supabase.co';
  const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  return createClient(url, key);
};
