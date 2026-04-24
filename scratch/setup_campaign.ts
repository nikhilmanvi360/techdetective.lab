import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function setupCampaignCase() {
  console.log('Setting up Campaign Case (ID 999)...');
  
  const { data, error } = await supabase.from('cases').upsert({
    id: 999,
    title: 'Round 2 Campaign Map',
    description: 'Internal case record for persisting team campaign state.',
    difficulty: 'Dynamic',
    status: 'hidden',
    points_on_solve: 0
  });

  if (error) {
    console.error('Failed to create campaign case:', error);
  } else {
    console.log('Campaign Case created/updated successfully.');
  }
}

setupCampaignCase();
