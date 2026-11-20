import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

assert(url, 'Missing VITE_SUPABASE_URL in .env');
assert(key, 'Missing VITE_SUPABASE_ANON_KEY in .env');

console.log('Testing live Supabase connection to:', url);
const supabase = createClient(url, key);

async function runTests() {
  console.log('\n--- 1. Testing Auth Login ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sales.manager@salesflow.com',
    password: 'Manager456!'
  });
  assert(!authError, `Auth failed: ${authError?.message}`);
  console.log('✓ Successfully authenticated as:', authData.user.email);
  console.log('  User ID:', authData.user.id);

  console.log('\n--- 2. Querying user_profiles ---');
  const { data: profiles, error: pError } = await supabase.from('user_profiles').select('*');
  assert(!pError, `user_profiles query failed: ${pError?.message}`);
  console.log(`✓ Fetched ${profiles.length} user profiles`);

  console.log('\n--- 3. Querying contacts ---');
  const { data: contacts, error: cError } = await supabase.from('contacts').select('*');
  assert(!cError, `contacts query failed: ${cError?.message}`);
  console.log(`✓ Fetched ${contacts.length} contacts from live Supabase`);

  console.log('\n--- 4. Querying deals ---');
  const { data: deals, error: dError } = await supabase.from('deals').select('*');
  assert(!dError, `deals query failed: ${dError?.message}`);
  console.log(`✓ Fetched ${deals.length} deals from live Supabase`);

  console.log('\n--- 5. Querying tasks ---');
  const { data: tasks, error: tError } = await supabase.from('tasks').select('*');
  assert(!tError, `tasks query failed: ${tError?.message}`);
  console.log(`✓ Fetched ${tasks.length} tasks from live Supabase`);

  console.log('\n--- 6. Querying activities ---');
  const { data: activities, error: aError } = await supabase.from('activities').select('*');
  assert(!aError, `activities query failed: ${aError?.message}`);
  console.log(`✓ Fetched ${activities.length} activities from live Supabase`);

  console.log('\n--- 7. Live Supabase Contact CRUD (Create, Update, Delete) ---');
  const testContact = {
    first_name: 'QA',
    last_name: `Engineer-${Date.now()}`,
    email: `qa.test.${Date.now()}@example.com`,
    company: 'QA Automation Corp',
    position: 'Director of QA',
    phone: '+1-555-0199',
    status: 'active',
    user_id: authData.user.id
  };
  const { data: newContact, error: insertError } = await supabase.from('contacts').insert([testContact]).select().single();
  assert(!insertError, `Contact insert failed: ${insertError?.message}`);
  console.log('✓ Live contact insert successful, ID:', newContact.id);

  const { data: updatedContact, error: updateError } = await supabase.from('contacts')
    .update({ position: 'VP of QA' })
    .eq('id', newContact.id)
    .select().single();
  assert(!updateError, `Contact update failed: ${updateError?.message}`);
  assert.strictEqual(updatedContact.position, 'VP of QA', 'Updated position does not match');
  console.log('✓ Live contact update successful');

  const { error: deleteError } = await supabase.from('contacts').delete().eq('id', newContact.id);
  assert(!deleteError, `Contact delete failed: ${deleteError?.message}`);
  console.log('✓ Live contact delete / cleanup successful');

  console.log('\n--- 8. Live Supabase Deal CRUD (Create, Update, Delete) ---');
  const testDeal = {
    title: `Enterprise QA Deal ${Date.now()}`,
    value: 75000,
    stage: 'qualified',
    probability: 40,
    expected_close_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    user_id: authData.user.id
  };
  const { data: newDeal, error: dealInsertError } = await supabase.from('deals').insert([testDeal]).select().single();
  assert(!dealInsertError, `Deal insert failed: ${dealInsertError?.message}`);
  console.log('✓ Live deal insert successful, ID:', newDeal.id);

  const { data: updatedDeal, error: dealUpdateError } = await supabase.from('deals')
    .update({ stage: 'negotiation', probability: 85 })
    .eq('id', newDeal.id)
    .select().single();
  assert(!dealUpdateError, `Deal update failed: ${dealUpdateError?.message}`);
  assert.strictEqual(updatedDeal.stage, 'negotiation', 'Updated stage does not match');
  console.log('✓ Live deal stage transition successful');

  const { error: dealDeleteError } = await supabase.from('deals').delete().eq('id', newDeal.id);
  assert(!dealDeleteError, `Deal delete failed: ${dealDeleteError?.message}`);
  console.log('✓ Live deal delete / cleanup successful');

  console.log('\n----------------------------------------------------');
  console.log('ALL LIVE SUPABASE VERIFICATION CHECKS PASSED (8/8)');
  console.log('----------------------------------------------------');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
