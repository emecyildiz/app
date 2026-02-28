const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Parse backend/.env only outside production
let fileEnv = {};
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    const content = fs.readFileSync(envPath);
    fileEnv = dotenv.parse(content);
  } catch (_e) {
    fileEnv = {};
  }
}

const supabaseUrl = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is not configured.');
}

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for backend operations with RLS enabled.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'ratemet-backend',
    },
  },
});

module.exports = supabase;
  global: {

    headers: {
    }
  }
