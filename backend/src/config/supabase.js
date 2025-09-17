const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL is not set.');
}

// Always prefer service role for backend to bypass RLS safely
let supabaseKeyToUse = serviceRoleKey || null;
if (!supabaseKeyToUse) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Backend writes may fail due to RLS. Falling back to ANON key.');
  supabaseKeyToUse = anonKey;
}

const supabase = createClient(supabaseUrl, supabaseKeyToUse);

module.exports = supabase;


