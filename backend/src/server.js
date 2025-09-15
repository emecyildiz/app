const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Basic CORS setup (allow multiple origins via env)
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3001,http://localhost:3002,https://app-eta-five-56.vercel.app').split(',');
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

// TMDB API setup
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';

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

// (removed duplicate) Public search users - see normalized version below

// (removed duplicate) Public profile fetch - see normalized version below

// (removed duplicate) User stats - see auth-guarded version below

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
    const mapped = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      avatar: p.avatar_url || null,
      role: p.role,
    }));
    res.json(mapped);
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
    const p = (arr && arr[0]) || null;
    if (!p) return res.status(404).json({ error: 'not_found' });

    const { count: ratingsCount } = await supabase
      .from('movie_ratings')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', p.id);

    // Normalized response for frontend
    res.json({
      id: p.id,
      name: p.name,
      username: p.username,
      avatar: p.avatar_url || null,
      bio: p.bio || null,
      location: p.location || null,
      memberSince: p.created_at || null,
      isPublic: (p?.social_links && typeof p.social_links === 'object') ? (p.social_links.privacy !== 'private') : true,
      stats: {
        ratings: ratingsCount || 0,
        favorites: 0,
        watchedMovies: 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public privacy status by username or id
app.get('/api/users/privacy/:identifier', async (req, res) => {
  try {
    const idf = decodeURIComponent(req.params.identifier);
    let query = supabase.from('profiles').select('social_links').limit(1);
    if (/^[0-9a-fA-F-]{36}$/.test(idf)) query = query.eq('id', idf);
    else query = query.eq('username', idf);
    const { data: arr, error } = await query;
    if (error) throw error;
    const p = (arr && arr[0]) || null;
    if (!p) return res.status(404).json({ error: 'not_found' });
    const isPublic = (p?.social_links && typeof p.social_links === 'object') ? (p.social_links.privacy !== 'private') : true;
    res.json({ isPublic });
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

// TMDB API Endpoints
app.get('/api/movies/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/latest', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/top-rated', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        append_to_response: 'credits,videos,images'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        query,
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        with_genres: genreId,
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

app.get('/api/movies/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}/similar`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB API error' });
  }
});

// Ensure a movie row exists (service role upsert)
app.post('/api/movies/ensure', requireUser, async (req, res) => {
  try {
    const { id, title } = req.body || {}
    const movieId = parseInt(id, 10)
    if (!movieId || Number.isNaN(movieId)) return res.status(400).json({ success: false, error: 'invalid_id' })
    const payload = {
      id: movieId,
      title: title || null
    }
    const { error } = await supabase
      .from('movies')
      .upsert(payload, { onConflict: 'id' })
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    console.error('movies/ensure error:', e)
    res.status(500).json({ success: false, error: e?.message || 'internal_error' })
  }
})

// ========== Friendships ==========
// Get friendship status with other user
app.get('/api/friends/status/:otherUserId', requireUser, async (req, res) => {
  try {
    const me = req.user.id;
    const other = req.params.otherUserId;
    if (!other) return res.status(400).json({ error: 'otherUserId required' });
    if (other === me) return res.json({ status: 'self' });

    const { data: rows, error } = await supabase
      .from('friendships')
      .select('id, from_user_id, to_user_id, status, created_at')
      .or(`and(from_user_id.eq.${me},to_user_id.eq.${other}),and(from_user_id.eq.${other},to_user_id.eq.${me})`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    const r = (rows && rows[0]) || null;
    if (!r) return res.json({ status: 'none' });
    if (r.status === 'accepted') return res.json({ status: 'friends' });
    if (r.status === 'pending') {
      if (r.from_user_id === me) return res.json({ status: 'pending_outgoing' });
      if (r.to_user_id === me) return res.json({ status: 'pending_incoming' });
    }
    return res.json({ status: 'none' });
  } catch (e) {
    console.error('friends/status error:', e);
    // If friend_requests table does not exist yet, degrade gracefully
    if (e?.message?.includes('relation') || e?.code === 'PGRST204') {
      return res.json({ status: 'none' });
    }
    res.status(500).json({ error: 'internal_error' });
  }
});

// ========== Favorites ==========
// Add favorite
app.post('/api/favorites', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const movieIdRaw = req.body?.movieId;
    const movieId = parseInt(movieIdRaw, 10);
    if (!movieId || Number.isNaN(movieId)) return res.status(400).json({ success: false, error: 'movieId required' });
    // Upsert-like behavior: ignore duplicates
    const { data, error } = await supabase
      .from('favorites')
      .upsert({ user_id: uid, movie_id: movieId }, { onConflict: 'user_id,movie_id', ignoreDuplicates: true })
      .select('user_id')
      .single();
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error('favorites add error:', e);
    res.status(500).json({ success: false });
  }
});

// Remove favorite
app.delete('/api/favorites/:movieId', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const movieId = parseInt(req.params.movieId, 10);
    if (!movieId || Number.isNaN(movieId)) return res.status(400).json({ success: false, error: 'movieId invalid' });
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', uid)
      .eq('movie_id', movieId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error('favorites remove error:', e);
    res.status(500).json({ success: false });
  }
});

// Get my favorites count
app.get('/api/users/favorites/count', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const { count, error } = await supabase
      .from('favorites')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', uid);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (e) {
    console.error('favorites count error:', e);
    res.status(500).json({ count: 0 });
  }
});

// Get user's favorite movie IDs (self only for now)
app.get('/api/users/:userId/favorites', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const target = req.params.userId;
    if (target !== uid) return res.status(403).json({ error: 'forbidden' });
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('favorites')
      .select('movie_id', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    const items = (data || []).map(r => r.movie_id);
    res.json({ items, totalPages: Math.ceil((count || 0) / limit) });
  } catch (e) {
    console.error('favorites list error:', e);
    res.status(500).json({ items: [], totalPages: 0 });
  }
});

// Send friend request
app.post('/api/friends/request', requireUser, async (req, res) => {
  try {
    const me = req.user.id;
    const toUserId = req.body?.toUserId;
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });
    if (toUserId === me) return res.status(400).json({ error: 'cannot_add_self' });

    // Check existing relationship
    const { data: existing, error: exErr } = await supabase
      .from('friendships')
      .select('id, from_user_id, to_user_id, status')
      .or(`and(from_user_id.eq.${me},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${me})`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (exErr) throw exErr;
    const ex = (existing && existing[0]) || null;
    if (ex) {
      if (ex.status === 'accepted') return res.json({ success: true, status: 'friends' });
      if (ex.status === 'pending') {
        const status = ex.from_user_id === me ? 'pending_outgoing' : 'pending_incoming';
        return res.json({ success: true, status });
      }
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert({ from_user_id: me, to_user_id: toUserId, status: 'pending' })
      .select('id')
      .single();
    if (error) throw error;
    res.json({ success: true, status: 'pending_outgoing', requestId: data.id });
  } catch (e) {
    console.error('friends/request error:', e);
    res.status(500).json({ success: false, error: e?.message || 'internal_error' });
  }
});

// Respond to friend request (accept or reject)
app.post('/api/friends/respond', requireUser, async (req, res) => {
  try {
    const me = req.user.id;
    const fromUserId = req.body?.fromUserId;
    const action = (req.body?.action || '').toString();
    if (!fromUserId || !action) return res.status(400).json({ error: 'invalid_payload' });

    // Find the pending request to me
    const { data: reqRow, error: findErr } = await supabase
      .from('friendships')
      .select('id, status')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', me)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (findErr || !reqRow) return res.json({ success: false, status: 'none' });

    if (action === 'accept') {
      const { error: updErr } = await supabase
        .from('friendships')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', reqRow.id);
      if (updErr) throw updErr;
      return res.json({ success: true, status: 'friends' });
    }
    if (action === 'reject') {
      const { error: delErr } = await supabase
        .from('friendships')
        .delete()
        .eq('id', reqRow.id);
      if (delErr) throw delErr;
      return res.json({ success: true, status: 'none' });
    }
    return res.status(400).json({ error: 'invalid_action' });
  } catch (e) {
    console.error('friends/respond error:', e);
    res.status(500).json({ success: false, error: e?.message || 'internal_error' });
  }
});

// Unfriend
app.delete('/api/friends/:otherUserId', requireUser, async (req, res) => {
  try {
    const me = req.user.id;
    const other = req.params.otherUserId;
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(from_user_id.eq.${me},to_user_id.eq.${other},status.eq.accepted),and(from_user_id.eq.${other},to_user_id.eq.${me},status.eq.accepted)`);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error('friends/unfriend error:', e);
    res.status(500).json({ success: false, error: e?.message || 'internal_error' });
  }
});

// List friends
app.get('/api/friends/list/:userId?', requireUser, async (req, res) => {
  try {
    const target = req.params.userId || req.user.id;
    const { data: links, error } = await supabase
      .from('friendships')
      .select('from_user_id, to_user_id')
      .or(`from_user_id.eq.${target},to_user_id.eq.${target}`)
      .eq('status', 'accepted');
    if (error) throw error;
    const friendIds = new Set();
    (links || []).forEach(l => {
      if (l.from_user_id === target) friendIds.add(l.to_user_id);
      else friendIds.add(l.from_user_id);
    });
    const ids = Array.from(friendIds);
    if (ids.length === 0) return res.json([]);
    const { data: profs, error: perr } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', ids);
    if (perr) throw perr;
    const list = (profs || []).map(p => ({ id: p.id, name: p.name, username: p.username, avatar: p.avatar_url || null }));
    res.json(list);
  } catch (e) {
    console.error('friends/list error:', e);
    res.status(500).json({ error: e?.message || 'internal_error' });
  }
});

// List incoming friend requests
app.get('/api/friends/requests', requireUser, async (req, res) => {
  try {
    const me = req.user.id;
    const { data: reqs, error } = await supabase
      .from('friendships')
      .select('id, from_user_id, created_at, profiles:from_user_id(id, name, username, avatar_url)')
      .eq('to_user_id', me)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const shaped = (reqs || []).map(r => ({
      id: r.id,
      fromUser: {
        id: r.profiles?.id || r.from_user_id,
        name: r.profiles?.name || null,
        username: r.profiles?.username || null,
        avatar: r.profiles?.avatar_url || null,
      },
      createdAt: r.created_at,
    }));
    res.json(shaped);
  } catch (e) {
    console.error('friends/requests error:', e);
    res.status(500).json({ error: e?.message || 'internal_error' });
  }
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
