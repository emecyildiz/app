const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env file manually to avoid encoding issues
const envPath = path.resolve(__dirname, '../.env');
try {
  const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
  Object.keys(envConfig).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = envConfig[key];
    }
  });
} catch (err) {
  console.error('Failed to load .env:', err.message);
}

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(express.json());
app.set('trust proxy', 1);

// Basic security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Global rate limiting (DDoS/abuse protection)
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'too_many_requests' },
  })
);

// Basic CORS setup (allow multiple origins via env)
const rawOrigins = [
  process.env.ALLOWED_ORIGIN,
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .join(',');

const allowedOrigins = (rawOrigins || 'http://localhost:3001,http://localhost:3002')
  .split(',')
  .map((o) => o.trim());
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

async function isModerator(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) return false;
  return data?.role === 'MODERATOR' || data?.role === 'ADMIN';
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

async function requireAdminOrModerator(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const ok = await isModerator(user.id);
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
    const [
      { count: favoritesCount },
      { count: ratingsCount },
      { count: commentsCount }
    ] = await Promise.all([
      supabase.from('favorites').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('comments').select('user_id', { count: 'exact', head: true }).eq('user_id', uid),
    ]);
    res.json({ favoritesCount: favoritesCount || 0, ratingsCount: ratingsCount || 0, commentsCount: commentsCount || 0, memberSince: null, memberSinceDays: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Activity tracking (best-effort)
app.post('/api/users/activity', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const { error } = await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', uid);
    if (error) {
      // If the column doesn't exist or update fails, ignore and still respond OK
      return res.json({ success: true });
    }
    return res.json({ success: true });
  } catch (e) {
    return res.json({ success: true });
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

// ========== Comments ==========
// Add or update comment for a movie by current user (comment-only allowed)
app.post('/api/comments', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const { movieId, content, movieTitle, posterPath } = req.body || {};
    const mid = parseInt(movieId, 10);
    if (!mid || Number.isNaN(mid)) return res.status(400).json({ success: false, error: 'invalid_movieId' });
    const text = (typeof content === 'string' ? content : '').trim();
    if (!text) {
      return res.status(400).json({ success: false, error: 'empty_comment' });
    }
    // Ensure movie exists for potential FK
    try {
      const { error: movieErr } = await supabase
        .from('movies')
        .upsert({ 
          id: mid, 
          title: movieTitle || `Film #${mid}`,
          poster_path: posterPath || null 
        }, { onConflict: 'id' });
      if (movieErr) throw movieErr;
    } catch (ensureErr) {
      console.error('comments ensure movie error:', ensureErr);
      // not fatal if no FK is set
    }
    // Manual upsert to work even if unique index isn't present
    const { data: existing, error: findErr } = await supabase
      .from('comments')
      .select('id')
      .eq('user_id', uid)
      .eq('movie_id', mid)
      .maybeSingle();
    if (findErr && findErr.code && findErr.code !== 'PGRST116') throw findErr;
    if (existing && existing.id) {
      const { error: updErr } = await supabase
        .from('comments')
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from('comments')
        .insert({ user_id: uid, movie_id: mid, content: text });
      if (insErr) throw insErr;
    }
    res.json({ success: true });
  } catch (e) {
    console.error('comments upsert error:', e);
    res.status(500).json({ success: false, error: e?.message || 'internal_error' });
  }
});

// List my comments (paginated)
app.get('/api/users/me/comments', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    res.json({ comments: data || [], totalPages: Math.ceil((count || 0) / limit) });
  } catch (e) {
    console.error('comments list error:', e);
    res.status(500).json({ comments: [], totalPages: 0 });
  }
});

// Delete my comment for a movie
app.delete('/api/comments/:movieId', requireUser, async (req, res) => {
  try {
    const uid = req.user.id;
    const mid = parseInt(req.params.movieId, 10);
    if (!mid || Number.isNaN(mid)) return res.status(400).json({ success: false, error: 'invalid_movieId' });
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('user_id', uid)
      .eq('movie_id', mid);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error('comments delete error:', e);
    res.status(500).json({ success: false, error: e?.message || 'internal_error' });
  }
});

// Ensure a movie row exists (service role upsert)
app.post('/api/movies/ensure', requireUser, async (req, res) => {
  try {
    const { id, title, posterPath } = req.body || {}
    const movieId = parseInt(id, 10)
    if (!movieId || Number.isNaN(movieId)) return res.status(400).json({ success: false, error: 'invalid_id' })
    const payload = {
      id: movieId,
      title: title || `Film #${movieId}`,
      poster_path: posterPath || null
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
    const fromUserId = req.user.id;
    const { toUserId } = req.body;

    // Validation
    if (!toUserId) {
      return res.status(400).json({ error: 'toUserId is required' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check for existing friendship/request (Bi-directional check)
    const { data: existing, error: existErr } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .maybeSingle();

    if (existErr) throw existErr;
    
    if (existing) {
      // If request already exists, just return success to Frontend
      return res.json({ success: true, status: existing.status, message: 'Request already exists' });
    }

    // Insert into Database
    const { data, error } = await supabase
      .from('friendships')
      .insert([
        {
          from_user_id: fromUserId,
          to_user_id: toUserId,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, status: 'pending', data });

  } catch (error) {
    console.error('Error in /api/friends/request:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error?.message });
  }
});

// ========== RESPOND TO FRIEND REQUEST (Accept/Reject) ==========
app.post('/api/friends/respond', requireUser, async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user (The Receiver)
    const { requestId, action } = req.body; // action: 'accept' or 'reject'

    if (!requestId || !action) {
      return res.status(400).json({ error: 'requestId and action are required' });
    }

    // 1. Determine new status
    let newStatus;
    if (action === 'accept') newStatus = 'accepted';
    else if (action === 'reject') newStatus = 'rejected';
    else return res.status(400).json({ error: 'Invalid action' });

    // 2. Update the friendship status
    // CRITICAL: We must ensure the logged-in user is the 'to_user_id' (Receiver)
    // We update based on the unique 'id' of the friendship row (requestId)
    const { data, error } = await supabase
      .from('friendships')
      .update({ 
        status: newStatus,
        updated_at: new Date()
      })
      .eq('id', requestId)       // Find by Row ID
      .eq('to_user_id', userId)  // Security check: Only receiver can respond
      .select()
      .single();

    if (error) throw error;

    if (!data) {
        return res.status(404).json({ error: 'Friend request not found or you are not authorized' });
    }

    return res.json({ success: true, status: newStatus, data });

  } catch (error) {
    console.error('Error in /api/friends/respond:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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

// ========== LIST INCOMING REQUESTS (Gelen İstekler) ==========
app.get('/api/friends/requests', requireUser, async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user

    // 1. Get all pending requests where I am the receiver (to_user_id)
    const { data: requests, error } = await supabase
      .from('friendships')
      .select('id, from_user_id, created_at, status') // Select only necessary fields
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!requests || requests.length === 0) return res.json([]);

    // 2. Extract sender IDs
    const senderIds = requests.map(r => r.from_user_id);

    // 3. Fetch sender profiles manually (Safer than Join)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', senderIds);

    if (profileError) throw profileError;

    // 4. Combine Request + Profile Data with frontend-compatible structure
    const result = requests.map(req => {
      const senderProfile = profiles.find(p => p.id === req.from_user_id);
      return {
        id: req.id,
        fromUser: {
          id: req.from_user_id,
          name: senderProfile?.name || 'Unknown User',
          username: senderProfile?.username || 'unknown',
          avatar: senderProfile?.avatar_url || null,
        },
        createdAt: req.created_at,
      };
    });

    return res.json(result);

  } catch (error) {
    console.error('Error in /api/friends/requests:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
    const totalModerators = (profiles || []).filter(p => p.role === 'MODERATOR').length;
    
    // Calculate active users (last 24 hours and last 15 minutes)
    let activeUsers = 0;
    let realTimeActiveUsers = 0;
    try {
      const authUsers = await listAllAuthUsers();
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last15Minutes = new Date(now.getTime() - 15 * 60 * 1000);
      
      authUsers.forEach(user => {
        if (user.last_sign_in_at) {
          const lastSignIn = new Date(user.last_sign_in_at);
          if (lastSignIn >= last24Hours) {
            activeUsers++;
          }
          if (lastSignIn >= last15Minutes) {
            realTimeActiveUsers++;
          }
        }
      });
    } catch (authErr) {
      console.error('Error calculating active users:', authErr);
      // Continue with 0 values if auth fetch fails
    }
    
    res.json({ totalUsers, totalModerators, activeUsers, realTimeActiveUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/users', requireAdminOrModerator, async (req, res) => {
  try {
    // Get current user's role
    const currentUser = req.user;
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();
    
    const isAdmin = currentProfile?.role === 'ADMIN';
    
    let query = supabase
      .from('profiles')
      .select('id, name, username, role, created_at');
    
    // Moderators can only see USER role, not ADMIN or MODERATOR
    if (!isAdmin) {
      query = query.eq('role', 'USER');
    }
    
    const { data: profiles, error } = await query;
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

app.get('/api/admin/moderators', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, role, created_at')
      .eq('role', 'MODERATOR');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update user profile (Admin or Moderator can update)
app.put('/api/admin/users/:userId', requireAdminOrModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if moderator is trying to edit admin/moderator
    const currentUser = req.user;
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();
    
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    // Moderators can only edit USER role
    if (currentProfile?.role === 'MODERATOR' && targetProfile?.role !== 'USER') {
      return res.status(403).json({ success: false, error: 'Moderators can only edit users, not admins or moderators' });
    }
    
    const { name, username, bio, location } = req.body;
    
    // Update profile in database
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (e) {
    console.error('Error updating user:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    
    // Profile will be deleted automatically via CASCADE if FK is set
    // Otherwise, manually delete profile
    await supabase.from('profiles').delete().eq('id', userId);
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting user:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================
// ========== RECOMMENDATIONS APIs ==========
// ==========================================

// 1. SEND RECOMMENDATION (Fixed for Array Payload)
app.post('/api/recommendations', requireUser, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    // Extract data from the new frontend payload structure
    const { toUserId, movieIds, note } = req.body;

    // Validation
    if (!toUserId) {
        return res.status(400).json({ error: 'Receiver (toUserId) is missing' });
    }
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
        return res.status(400).json({ error: 'No movies selected (movieIds array missing or empty)' });
    }
    if (fromUserId === toUserId) {
        return res.status(400).json({ error: 'Cannot recommend to self' });
    }

    const results = [];
    const errors = [];

    // Loop through each Movie ID in the array
    for (const movieId of movieIds) {
        try {
            // A. Insert into Main Table
            const { data: recData, error: recError } = await supabase
                .from('recommendations')
                .insert([{
                    from_user_id: fromUserId,
                    to_user_id: toUserId,
                    movie_id: movieId,
                    status: 'pending'
                    // Note: If you have a 'content' or 'note' column, add: content: note
                }])
                .select()
                .single();

            if (recError) throw recError;

            // B. Insert into Items Table
            // Since frontend only sends IDs now, we use a placeholder title or fetch it if possible.
            // For now, we save it to prevent crashes.
            if (recData) {
                await supabase.from('recommendation_items').insert([{
                    recommendation_id: recData.id,
                    movie_id: movieId,
                    movie_title: 'Movie ID ' + movieId, // Placeholder until fetched
                    poster_path: null
                }]);
                results.push(recData);
            }
        } catch (innerErr) {
            console.error(`Failed to recommend movie ${movieId}:`, innerErr);
            errors.push({ movieId, error: innerErr.message });
        }
    }

    // Return success if at least one movie was recommended
    if (results.length > 0) {
        res.json({ success: true, count: results.length, data: results, errors });
    } else {
        res.status(500).json({ error: 'Failed to save recommendations', details: errors });
    }

  } catch (error) {
    console.error('POST recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. LIST RECOMMENDATIONS (Önerileri Listele - 404 Fix)
app.get('/api/recommendations', requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query; // type: 'received' | 'sent'

    // A. Build Query for Main Table
    let query = supabase.from('recommendations')
        .select('id, from_user_id, to_user_id, movie_id, status, created_at')
        .order('created_at', { ascending: false });

    if (type === 'sent') query = query.eq('from_user_id', userId);
    else query = query.eq('to_user_id', userId); // default: received

    if (status) query = query.eq('status', status);

    const { data: recs, error: recError } = await query;
    if (recError) throw recError;
    if (!recs || recs.length === 0) return res.json([]);

    // B. Fetch Related Data Manually (Safer than Joins)
    const recIds = recs.map(r => r.id);
    const userIds = new Set();
    recs.forEach(r => { userIds.add(r.from_user_id); userIds.add(r.to_user_id); });

    // Fetch Items (Movie Details)
    const { data: items } = await supabase
        .from('recommendation_items')
        .select('recommendation_id, movie_id, movie_title, poster_path')
        .in('recommendation_id', recIds);

    // Fetch Profiles (Users)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', Array.from(userIds));

    // C. Merge Data for Frontend
    const result = recs.map(r => {
        // Get ALL items for this recommendation (not just the first one)
        const recItems = (items || []).filter(i => i.recommendation_id === r.id);
        const fromUser = profiles?.find(p => p.id === r.from_user_id);
        const toUser = profiles?.find(p => p.id === r.to_user_id);

        return {
            id: r.id,
            status: r.status,
            createdAt: r.created_at,
            fromUser: {
                id: r.from_user_id,
                name: fromUser?.name || 'Unknown',
                username: fromUser?.username || 'unknown',
                avatar: fromUser?.avatar_url || null
            },
            toUser: {
                id: r.to_user_id,
                name: toUser?.name || 'Unknown',
                username: toUser?.username || 'unknown',
                avatar: toUser?.avatar_url || null
            },
            items: recItems.map(item => ({
                movie_id: item.movie_id,
                movie_title: item.movie_title || 'Unknown Movie',
                poster_path: item.poster_path || null
            }))
        };
    });

    res.json(result);

  } catch (error) {
    console.error('GET recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. UPDATE STATUS (Opsiyonel - Okundu/İzlendi yapmak için)
app.put('/api/recommendations/:id', requireUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { error } = await supabase
            .from('recommendations')
            .update({ status })
            .eq('id', id)
            .eq('to_user_id', req.user.id); // Only receiver can update
            
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. DELETE RECOMMENDATION (Soft Delete)
app.delete('/api/recommendations/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Öneriyi bul
    const { data: rec, error: findErr } = await supabase
      .from('recommendations')
      .select('id, from_user_id, to_user_id, deleted_by_sender, deleted_by_recipient')
      .eq('id', id)
      .single();
      
    if (findErr || !rec) {
      return res.status(404).json({ error: 'Öneri bulunamadı' });
    }
    
    // Kullanıcının silme yetkisi var mı kontrol et
    let updates = {};
    if (rec.from_user_id === userId) {
      updates.deleted_by_sender = true;
    } else if (rec.to_user_id === userId) {
      updates.deleted_by_recipient = true;
    } else {
      return res.status(403).json({ error: 'Bu öneriyi silme yetkiniz yok' });
    }
    
    // Soft delete yap
    const { error: updErr } = await supabase
      .from('recommendations')
      .update(updates)
      .eq('id', id);
      
    if (updErr) throw updErr;
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE RECOMMENDATION (POST alternative - bazı ortamlar DELETE'i engeller)
app.post('/api/recommendations/:id/delete', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Öneriyi bul
    const { data: rec, error: findErr } = await supabase
      .from('recommendations')
      .select('id, from_user_id, to_user_id, deleted_by_sender, deleted_by_recipient')
      .eq('id', id)
      .single();
      
    if (findErr || !rec) {
      return res.status(404).json({ error: 'Öneri bulunamadı' });
    }
    
    // Kullanıcının silme yetkisi var mı kontrol et
    let updates = {};
    if (rec.from_user_id === userId) {
      updates.deleted_by_sender = true;
    } else if (rec.to_user_id === userId) {
      updates.deleted_by_recipient = true;
    } else {
      return res.status(403).json({ error: 'Bu öneriyi silme yetkiniz yok' });
    }
    
    // Soft delete yap
    const { error: updErr } = await supabase
      .from('recommendations')
      .update(updates)
      .eq('id', id);
      
    if (updErr) throw updErr;
    
    res.json({ success: true });
  } catch (error) {
    console.error('POST delete recommendation error:', error);
    res.status(500).json({ error: error.message });
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

// === N8N ve TELEGRAM TEST YOLLARI (Chaos Endpoints) ===

// 1. Sistem Çöküşü Testi (500 Hatası simülasyonu)
app.get('/api/test-hata', (req, res, next) => {
  const fakeError = new Error("SİSTEM TESTİ: Bu bilerek oluşturulmuş bir veritabanı çöküş hatasıdır!");
  fakeError.name = "DatabaseError"; // Switch düğümündeki kurala takılması için
  next(fakeError); // Bu komut hatayı doğrudan n8n loglayıcıya fırlatır
});

// 2. Siber Saldırı Testi (403/Unauthorized simülasyonu)
app.get('/api/test-saldiri', (req, res, next) => {
  const hackError = new Error("SİSTEM TESTİ: Yönetici paneline yetkisiz giriş denemesi!");
  hackError.name = "Unauthorized"; // Switch düğümündeki siber saldırı kuralına takılması için
  next(hackError);
});

// === N8N LOG YAKALAYICI (Global Error Handler) ===
// Tüm API endpointlerinden sonra, app.listen'dan önce olmalı
app.use(async (err, req, res, next) => {
  // Hata logunu console'a yaz
  console.error("🔥 KRİTİK HATA YAKALANDI:", err.message);
  console.error("Stack:", err.stack);

  // n8n Webhook URL (environment variable'dan oku)
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

  // Eğer n8n URL tanımlıysa, log gönder
  if (N8N_WEBHOOK_URL) {
    try {
      await axios.post(
        N8N_WEBHOOK_URL,
        {
          source: 'RATEMET_BACKEND',
          environment: process.env.NODE_ENV || 'production',
          error_message: err.message,
          error_stack: err.stack,
          error_name: err.name,
          route: req.originalUrl,
          method: req.method,
          ip_address: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.ip,
          user_agent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
          // Ek bilgiler (opsiyonel)
          body: req.body ? JSON.stringify(req.body).substring(0, 500) : null, // İlk 500 karakter
          query: req.query,
        },
        {
          timeout: 3000, // 3 saniye timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log("✅ Hata logu n8n'e gönderildi");
    } catch (n8nError) {
      console.error("❌ n8n'e log gönderilemedi:", n8nError.message);
    }
  }

  // Kullanıcıya standart hata dön (sistem detaylarını sızdırma!)
  res.status(err.status || 500).json({
    error: 'Sunucu tarafında beklenmeyen bir hata oluştu.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
});
