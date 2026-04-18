import { supabase } from '../src/lib/supabase.js';
import bcrypt from 'bcryptjs';

async function createDemoTeam() {
  const teamName = 'DemoTeam';
  const password = 'password123';
  const hashedPassword = bcrypt.hashSync(password, 10);

  console.log(`--- CREATING DEMO TEAM: ${teamName} ---`);

  const { data, error } = await supabase
    .from('teams')
    .upsert({ 
      name: teamName, 
      password: hashedPassword 
    }, { onConflict: 'name' })
    .select()
    .single();

  if (error) {
    console.error('Error creating demo team:', error.message);
    if (error.message.includes('relation "teams" does not exist')) {
       console.log('\n[CRITICAL] The "teams" table does not exist in your Supabase database.');
       console.log('Please copy the contents of "database/schema.sql" into the Supabase SQL Editor first.');
    }
  } else {
    console.log('✔ Demo Team created successfully!');
    console.log('Team Name:', data.name);
    console.log('Password:', 'password123');
  }
}

createDemoTeam();
