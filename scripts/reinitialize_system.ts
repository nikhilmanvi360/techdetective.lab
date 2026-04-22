import { supabase } from '../src/lib/supabase';

async function reinitialize() {
  console.log('--- REINITIALIZING DATABASE (WIPE ALL, KEEP CCU_ADMIN) ---');

  const tablesToWipe = [
    'puzzle_attempts',
    'used_hints',
    'solved_puzzles',
    'team_badges',
    'submissions',
    'evidence',
    'puzzles',
    'cases'
  ];

  for (const table of tablesToWipe) {
    console.log(`Wiping ${table}...`);
    // Delete all records. neq('id', 0) is a hack to select everything usually.
    // Or for junction tables without id: .delete().neq('team_id', 0)
    const { error } = await supabase.from(table).delete().neq('id', -1);
    
    if (error && error.code === '42703') { // id column doesn't exist (junction tables)
       const { error: junctionError } = await supabase.from(table).delete().neq('team_id', -1);
       if (junctionError) console.error(`Error wiping ${table}:`, junctionError.message);
    } else if (error) {
       console.error(`Error wiping ${table}:`, error.message);
    }
  }

  console.log('Cleaning teams (preserving CCU_ADMIN)...');
  const { error: teamError } = await supabase
    .from('teams')
    .delete()
    .neq('name', 'CCU_ADMIN');
  
  if (teamError) console.error('Error cleaning teams:', teamError.message);

  console.log('Resetting CCU_ADMIN score...');
  const { error: resetError } = await supabase
    .from('teams')
    .update({ score: 0 })
    .eq('name', 'CCU_ADMIN');

  if (resetError) console.error('Error resetting admin score:', resetError.message);

  console.log('--- DATABASE WIPE COMPLETE ---');
}

reinitialize();
