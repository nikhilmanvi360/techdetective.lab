/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Isomorphic environment variable retrieval
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
// Use Anon Key for client, Service Role Key for server (if available)
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  const isProd = (typeof import.meta !== 'undefined' && import.meta.env?.PROD) || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
  
  if (isProd) {
    console.error('CRITICAL: Missing Supabase credentials in Production. App will crash on DB access.');
  } else {
    // Only warn if we are in a browser context or if we specifically expect these vars
    if (typeof window !== 'undefined') {
      console.warn('Missing Supabase credentials in browser. Database operations will fail.');
    }
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
