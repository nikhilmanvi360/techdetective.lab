import { supabase } from '../src/lib/supabase.js';
import bcrypt from 'bcryptjs';

async function factoryReset() {
  console.log('--- STARTING TOTAL FACTORY RESET (DESTRUCTIVE) ---');

  // Tables that will be wiped entirely
  const tables = [
    'investigation_links',
    'investigation_nodes',
    'adversary_actions',
    'case_team_state',
    'score_multipliers',
    'score_snapshots',
    'score_events',
    'team_badges',
    'puzzle_attempts',
    'used_hints',
    'solved_puzzles',
    'submissions',
    'evidence',
    'puzzles',
    'cases'
  ];

  for (const table of tables) {
    console.log(`Wiping table: ${table}...`);
    // delete().neq('id', -1) is a common pattern to delete all rows that Supabase JS client supports
    const { error } = await supabase.from(table).delete().neq('id', -1);
    
    if (error) {
      // Some tables might not have an 'id' column (junction tables)
      if (error.code === '42703') { 
        const { error: junctionError } = await supabase.from(table).delete().neq('team_id', -1);
        if (junctionError) console.error(`Error wiping ${table}:`, junctionError.message);
      } else {
        console.error(`Error wiping ${table}:`, error.message);
      }
    }
  }

  console.log('Cleaning teams table (preserving CCU_ADMIN)...');
  // First, delete everyone except the admin
  const { error: teamWipeError } = await supabase
    .from('teams')
    .delete()
    .neq('name', 'CCU_ADMIN');
  
  if (teamWipeError) console.error('Error wiping teams:', teamWipeError.message);

  console.log('Resetting CCU_ADMIN account...');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const { error: adminResetError } = await supabase
    .from('teams')
    .upsert({ 
      name: 'CCU_ADMIN', 
      password: hashedPassword,
      score: 0,
      is_disabled: false,
      token_version: 1
    }, { onConflict: 'name' });

  if (adminResetError) console.error('Error resetting admin account:', adminResetError.message);
  else console.log('✔ CCU_ADMIN restored to default (password: admin123)');

  console.log('Resetting adversary configuration...');
  const { error: advError } = await supabase
    .from('adversary_config')
    .upsert({
      id: 1, // Usually the only one
      is_active: false,
      intensity: 'low',
      lead_threshold: 200,
      actions_enabled: ['signal_interference', 'guidance_hint']
    }, { onConflict: 'id' });

  if (advError) console.error('Error resetting adversary config:', advError.message);

  console.log('--- FACTORY RESET COMPLETE ---');
  console.log('Database is now empty of all cases, puzzles, and player data.');
}

factoryReset();
