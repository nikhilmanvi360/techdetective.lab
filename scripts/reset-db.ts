import { supabase } from '../src/lib/supabase.js';

async function reset() {
  console.log('--- RESETTING DATABASE (DESTRUCTIVE) ---');

  const tables = [
    'score_events',
    'submissions',
    'solved_puzzles',
    'used_hints',
    'puzzle_attempts',
    'adversary_actions',
    'case_team_state',
    'team_badges',
    'notifications',
    'teams'
  ];

  for (const table of tables) {
    console.log(`Clearing table: ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', -1); // Deletes all rows where ID != -1
    if (error) console.error(`Error clearing ${table}:`, error.message);
  }

  // Note: We don't clear 'cases', 'puzzles', or 'evidence' because they are master data.
  // We keep 'adversary_config' but reset its state in init.ts

  console.log('--- RESET COMPLETE ---');
  console.log('Please run "npm run seed" to restore admin account and default settings.');
}

reset();
