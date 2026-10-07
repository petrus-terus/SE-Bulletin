import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xxqrrqyncsxmhplcomns.supabase.co', 'sb_publishable_RttHxuFFjZAqnA5nkpcOqA_RyF_tPjq');

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'testuser1@sesb.com.my',
    password: 'Password123!',
  });
  console.log('SignIn:', data, error);
}
run();
