import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
 if (process.env.NODE_ENV === 'production') {
 console.error('CRITICAL: Missing Supabase credentials in Production. App will crash on DB access.');
 } else {
 console.warn('Missing Supabase credentials. Database operations will fail.');
 }
}

export const supabase = createClient(
 supabaseUrl || 'https://placeholder.supabase.co',
 supabaseServiceKey || 'placeholder-key'
);
