const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

// TMDB API setup
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is missing in environment variables');
}

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

    const [{ count: ratingsCount }, { count: commentsCount }] = await Promise.all([
      supabase.from('ratings').select('user_id', { count: 'exact', head: true }).eq('user_id', p.id),
      supabase.from('comments').select('user_id', { count: 'exact', head: true }).eq('user_id', p.id),
    ]);

    // Normalized response for frontend
    res.json({
      id: p.id,
      name: p.name,
      username: p.username,
      avatar: p.avatar_url || null,
      bio: p.bio || null,
      location: p.location || null,
      memberSince: p.created_at || null,
      stats: {
        ratings: ratingsCount || 0,
        comments: commentsCount || 0,
        favorites: 0,
        watchedMovies: 0,
      },
    });
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
app.get('/api/movies', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'tr-TR'
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genre_ids: movie.genre_ids || []
    }));

    res.json({
      data: {
        movies,
        totalPages: response.data.total_pages,
        currentPage: parseInt(page),
        totalResults: response.data.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching movies from TMDB:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,videos,images',
        language: 'tr-TR'
      }
    });

    const movie = response.data;
    const formattedMovie = {
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      runtime: movie.runtime,
      status: movie.status,
      genres: movie.genres || [],
      cast: movie.credits?.cast?.slice(0, 10) || [],
      crew: movie.credits?.crew?.slice(0, 10) || [],
      videos: movie.videos?.results || [],
      images: movie.images || {}
    };

    res.json({
      data: {
        movie: formattedMovie
      }
    });
  } catch (error) {
    console.error('Error fetching movie from TMDB:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.get('/api/movies/genres', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    res.json({
      data: response.data.genres || []
    });
  } catch (error) {
    console.error('Error fetching genres from TMDB:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/movies/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 12 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        language: 'tr-TR'
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genre_ids: movie.genre_ids || []
    }));

    res.json({
      data: {
        movies,
        totalPages: response.data.total_pages,
        currentPage: parseInt(page),
        totalResults: response.data.total_results
      }
    });
  } catch (error) {
    console.error('Error searching movies from TMDB:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

app.get('/api/movies/trending', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    const movies = response.data.results.slice(0, 10).map(movie => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genre_ids: movie.genre_ids || []
    }));

    res.json({
      data: {
        movies
      }
    });
  } catch (error) {
    console.error('Error fetching trending movies from TMDB:', error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
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
