import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function test() {
  const { data, error } = await supabase.from('teams').select('count(*)');
  if (error) {
    console.error('Connection Failed:', error.message);
  } else {
    console.log('Connection Successful! Data:', data);
  }
}

test();
