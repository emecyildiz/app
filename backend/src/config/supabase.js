
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Parse backend/.env manually (robust to BOM/encoding issues)
let fileEnv = {};
try {
  const envPath = path.resolve(__dirname, '../../.env');
  const content = fs.readFileSync(envPath);
  fileEnv = dotenv.parse(content);
  console.log('DEBUG supabase.js fileEnv keys:', Object.keys(fileEnv));
} catch (e) {
  console.log('DEBUG supabase.js failed to read .env:', e.message);
  fileEnv = {};
}

const supabaseUrl = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || fileEnv.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL is not configured. Check backend/.env for SUPABASE_URL.'
  );
}

// Always prefer service role for backend to bypass RLS safely
let supabaseKeyToUse = serviceRoleKey || null;
if (!supabaseKeyToUse) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Backend writes may fail due to RLS. Falling back to ANON key.'
  );
  supabaseKeyToUse = anonKey;
}

const supabase = createClient(supabaseUrl, supabaseKeyToUse, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Backend doesn't need session persistence
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'ratemet-backend',
    },
  },
  // Set realistic timeout to avoid hanging requests
  realtime: {
    timeout: 10000,
  },
});

module.exports = supabase;


