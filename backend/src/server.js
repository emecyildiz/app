const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

// Basic CORS setup (allow multiple origins via env)
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3001,https://app-eta-five-56.vercel.app').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helpers
async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user || null;
}

async function isAdmin(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) return false;
  return data?.role === 'ADMIN';
}

async function requireUser(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const ok = await isAdmin(user.id);
    if (!ok) return res.status(403).json({ error: 'forbidden' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

async function listAllAuthUsers() {
  let page = 1;
  const perPage = 1000;
  const users = [];
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const arr = data?.users || [];
    if (arr.length === 0) break;
    users.push(...arr);
    page += 1;
  }
  return users;
}

// Check if email already exists (admin)
app.post('/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email required' })

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email
    })
    if (error) throw error
    const exists = Array.isArray(data?.users) && data.users.length > 0
    return res.json({ exists })
  } catch (err) {
    console.error('check-email error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

// Public search users
app.get('/api/users/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
    if (!q) return res.json([])
    const pattern = `%${q}%`
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, role')
      .or(`name.ilike.${pattern},username.ilike.${pattern}`)
      .limit(limit)
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Public profile fetch
app.get('/api/users/public/:identifier', async (req, res) => {
  try {
    const idf = decodeURIComponent(req.params.identifier)
    let query = supabase.from('profiles').select('*').limit(1)
    if (/^[0-9a-fA-F-]{36}$/.test(idf)) query = query.eq('id', idf)
    else query = query.eq('username', idf)
    const { data: arr, error } = await query
    if (error) throw error
    const profile = (arr && arr[0]) || null
    if (!profile) return res.status(404).json({ error: 'not_found' })
    const [{ count: ratingsCount }, { count: commentsCount }] = await Promise.all([
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('comments').select('user_id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ])
    res.json({ profile, stats: { ratingsCount: ratingsCount || 0, commentsCount: commentsCount || 0 } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// User stats (requires user)
app.get('/api/users/stats', requireAdmin, async (req, res) => {
  try {
    const uid = req.user.id
    const [{ count: favoritesCount }, { count: ratingsCount }] = await Promise.all([
      supabase.from('favorites').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
    ])
    res.json({ favoritesCount: favoritesCount || 0, ratingsCount: ratingsCount || 0, memberSince: null, memberSinceDays: 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Test endpoint
// Public search users by name or username
app.get('/api/users/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    if (!q) return res.json([]);
    const pattern = `%${q}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, role')
      .or(`name.ilike.${pattern},username.ilike.${pattern}`)
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public profile fetch by username or id
app.get('/api/users/public/:identifier', async (req, res) => {
  try {
    const idf = decodeURIComponent(req.params.identifier);
    let query = supabase.from('profiles').select('*').limit(1);
    if (/^[0-9a-fA-F-]{36}$/.test(idf)) query = query.eq('id', idf);
    else query = query.eq('username', idf);
    const { data: arr, error } = await query;
    if (error) throw error;
    const profile = (arr && arr[0]) || null;
    if (!profile) return res.status(404).json({ error: 'not_found' });

    const [{ count: ratingsCount }, { count: commentsCount }] = await Promise.all([
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('comments').select('user_id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ]);
    res.json({ profile, stats: { ratingsCount: ratingsCount || 0, commentsCount: commentsCount || 0 } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// My stats (requires auth)
app.get('/api/users/stats', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const [{ count: favoritesCount }, { count: ratingsCount }] = await Promise.all([
      supabase.from('favorites').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
    ]);
    res.json({ favoritesCount: favoritesCount || 0, ratingsCount: ratingsCount || 0, memberSince: null, memberSinceDays: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Admin APIs
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, role');
    if (error) throw error;
    const totalUsers = profiles?.length || 0;
    const totalOperators = (profiles || []).filter(p => p.role === 'OPERATOR').length;
    res.json({ totalUsers, totalOperators, activeUsers: 0, realTimeActiveUsers: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, username, role, created_at');
    if (error) throw error;

    // Attach emails from auth store
    let emailById = {};
    try {
      const authUsers = await listAllAuthUsers();
      authUsers.forEach(u => { emailById[u.id] = u.email; });
    } catch {}

    const list = (profiles || []).map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      role: p.role,
      created_at: p.created_at,
      email: emailById[p.id] || null,
    }));

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/operators', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, role, created_at')
      .eq('role', 'OPERATOR');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();

    if (error) throw error;

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
});
