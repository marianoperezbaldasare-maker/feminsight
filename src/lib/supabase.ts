import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Returns a real client when env vars are set, or a no-op stub when they are missing
export const supabase = url && key
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder');
