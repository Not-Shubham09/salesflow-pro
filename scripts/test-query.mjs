import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      contacts(first_name, last_name, company, email),
      activities(*)
    `)
    .limit(5);

  console.log('Result error:', error);
  console.log('Data length:', data?.length);
}

test();
