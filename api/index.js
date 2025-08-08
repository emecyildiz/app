// Required imports
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
// In proxy environments (Vercel/Railway), trust proxy to allow rate limiter to read client IP
app.set('trust proxy', 1);
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app-eta-five-56.vercel.app',
    'https://app-production-c295.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  console.log(`${req.method} ${req.path} from ${origin || 'unknown origin'}`);

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Supabase configuration (require env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT configuration (require env) - prefer SUPABASE_JWT_SECRET, fallback to JWT_SECRET
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
if (!JWT_SECRET) {
  console.error('JWT secret missing. Please set SUPABASE_JWT_SECRET (preferred) or JWT_SECRET');
}

// Auth middleware with error logging
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error?.message || '');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware with error logging
const adminMiddleware = (req, res, next) => {
  console.log('User Role:', req.user?.role);
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Operator or Admin middleware
const operatorOrAdminMiddleware = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'ADMIN' && role !== 'OPERATOR') {
    return res.status(403).json({ message: 'Operator or admin access required' });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl ? 'Configured' : 'Missing'
  });
});

// Simple debug endpoint to verify latest deploy
app.get('/api/ping', (_req, res) => {
  res.json({ pong: true, when: new Date().toISOString() });
});

// ===== TMDB configuration & helpers =====
const TMDB_API_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_V4_TOKEN = process.env.TMDB_V4_TOKEN || '';

const tmdbClient = axios.create({
  baseURL: TMDB_API_BASE_URL,
  headers: TMDB_V4_TOKEN ? { Authorization: `Bearer ${TMDB_V4_TOKEN}` } : undefined,
});

const withAuthParams = (params = {}) => {
  if (!TMDB_V4_TOKEN && TMDB_API_KEY) {
    return { api_key: TMDB_API_KEY, ...params };
  }
  return params;
};

let genresCache = null;
let genresCacheTs = 0;
const GENRES_TTL_MS = 1000 * 60 * 60; // 1 hour

async function fetchGenres() {
  const now = Date.now();
  if (genresCache && now - genresCacheTs < GENRES_TTL_MS) return genresCache;
  const resp = await tmdbClient.get('/genre/movie/list', {
    params: withAuthParams({ language: 'tr-TR' }),
  });
  const list = Array.isArray(resp.data?.genres) ? resp.data.genres : [];
  genresCache = list;
  genresCacheTs = now;
  return list;
}

function mapMovieSummary(tmdbMovie, genreListById) {
  const posterPath = tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null;
  const backdropPath = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const genreIds = Array.isArray(tmdbMovie.genre_ids) ? tmdbMovie.genre_ids : [];
  let genres = [];
  if (genreIds.length > 0) {
    genres = genreIds
      .map((id) => genreListById.get(id))
      .filter(Boolean);
  } else if (Array.isArray(tmdbMovie.genres)) {
    genres = tmdbMovie.genres.map(g => ({ id: g.id, name: g.name }))
  }

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || '',
    description: tmdbMovie.overview || '',
    poster: posterPath,
    backdrop: backdropPath,
    releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date || null,
    rating: typeof tmdbMovie.vote_average === 'number' ? tmdbMovie.vote_average : null,
    voteCount: tmdbMovie.vote_count || 0,
    genres,
    runtime: tmdbMovie.runtime || null,
  };
}

function mapMovieDetail(tmdbMovie) {
  const posterPath = tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null;
  const backdropPath = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const genres = Array.isArray(tmdbMovie.genres)
    ? tmdbMovie.genres.map(g => ({ id: g.id, name: g.name }))
    : [];
  const cast = Array.isArray(tmdbMovie.credits?.cast)
    ? tmdbMovie.credits.cast.slice(0, 10).map((c) => c.name).filter(Boolean)
    : [];
  const director = Array.isArray(tmdbMovie.credits?.crew)
    ? (tmdbMovie.credits.crew.find((c) => c.job === 'Director')?.name || null)
    : null;

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || '',
    description: tmdbMovie.overview || '',
    poster: posterPath,
    backdrop: backdropPath,
    releaseDate: tmdbMovie.release_date || null,
    rating: typeof tmdbMovie.vote_average === 'number' ? tmdbMovie.vote_average : null,
    voteCount: tmdbMovie.vote_count || 0,
    genres,
    runtime: tmdbMovie.runtime || null,
    director,
    cast,
  };
}

// ===== Movies (TMDB Proxy) =====
// List movies
app.get('/api/movies', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', sort_by: 'popularity.desc', page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;

    res.json({ success: true, data: { movies: sliced, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies' });
  }
});

// ===== Debug endpoints (temporary) =====
// Check env presence (without exposing secrets)
app.get('/api/debug/env', (_req, res) => {
  res.json({
    hasApiKey: Boolean(process.env.TMDB_API_KEY),
    hasV4Token: Boolean(process.env.TMDB_V4_TOKEN),
    baseUrl: TMDB_API_BASE_URL,
    nodeEnv: process.env.NODE_ENV || 'undefined',
  });
});

// Test direct TMDB call and return status/error shape
app.get('/api/debug/tmdb', async (_req, res) => {
  try {
    const resp = await tmdbClient.get('/genre/movie/list', {
      params: withAuthParams({ language: 'tr-TR' })
    });
    return res.json({ ok: true, status: resp.status, genresCount: (resp.data?.genres || []).length });
  } catch (error) {
    const status = error?.response?.status || 0;
    const data = error?.response?.data || null;
    return res.status(200).json({ ok: false, status, data, message: error?.message || 'unknown' });
  }
});


// Genres
app.get('/api/movies/genres', async (_req, res) => {
  try {
    const genres = await fetchGenres();
    res.json({ success: true, data: genres });
  } catch (error) {
    const status = error?.response?.status || 0;
    const msg = error?.response?.data?.status_message || error?.message || 'unknown';
    console.error('GET /api/movies/genres error:', status, msg);
    res.status(500).json({ success: false, message: 'Failed to fetch genres', data: [] });
  }
});

// Movies by genre
app.get('/api/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', with_genres: genreId, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: sliced, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/genre/:genreId error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies by genre' });
  }
});

// Search movies
app.get('/api/movies/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    if (!q) return res.json({ success: true, data: { movies: [], totalPages: 0, currentPage: 1 } });

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/search/movie', {
      params: withAuthParams({ language: 'tr-TR', query: q, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: sliced, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/search error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to search movies' });
  }
});

// Trending
app.get('/api/movies/trending', async (_req, res) => {
  try {
    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));
    const tmdbResp = await tmdbClient.get('/trending/movie/day', {
      params: withAuthParams({ language: 'tr-TR' }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    res.json({ success: true, data: { movies: mapped } });
  } catch (error) {
    console.error('GET /api/movies/trending error:', error?.message);
    res.status(500).json({ success: false, data: { movies: [] } });
  }
});

// Actors list (popular)
app.get('/api/movies/actors', async (_req, res) => {
  try {
    const resp = await tmdbClient.get('/person/popular', {
      params: withAuthParams({ language: 'tr-TR', page: 1 }),
    });
    const names = (resp.data?.results || []).map((p) => p.name).filter(Boolean);
    res.json({ success: true, data: names });
  } catch (error) {
    console.error('GET /api/movies/actors error:', error?.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// Movies by actor name
app.get('/api/movies/actor/:name', async (req, res) => {
  try {
    const raw = req.params.name || '';
    const name = decodeURIComponent(raw);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);

    const search = await tmdbClient.get('/search/person', {
      params: withAuthParams({ language: 'tr-TR', query: name, page: 1 }),
    });
    const person = (search.data?.results || [])[0];
    if (!person) return res.json({ success: true, data: { movies: [], totalPages: 0, currentPage: 1 } });

    const personId = person.id;
    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));
    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', with_cast: personId, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: sliced, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/actor/:name error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies by actor' });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    // Normalize and validate username (lowercase, a-z0-9_)
    const normalizedUsername = String(username).trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(normalizedUsername) || normalizedUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir ve en az 3 karakter olmalıdır' });
    }

    // Check if user exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Register - existing check error:', existingError);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }

    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta zaten kayıtlı' });
    }

    // Ensure username uniqueness
    const { data: usernameExists, error: usernameErr } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();
    if (usernameErr) {
      console.error('Register - username check error:', usernameErr);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
    if (usernameExists) {
      return res.status(409).json({ success: false, message: 'Bu kullanıcı adı zaten alınmış' });
    }

    const passwordhash = await bcrypt.hash(password, 10);

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, username: normalizedUsername, email, passwordhash, role: 'USER' }])
      .select('*')
      .single();

    if (insertError) {
      console.error('Register - insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Kayıt başarısız' });
    }

    const token = jwt.sign(
      { userId: insertedUser.id, email: insertedUser.email, role: insertedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordhash: _ph, ...userWithoutPassword } = insertedUser;

    return res.json({
      success: true,
      message: 'Kayıt başarılı',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Auth: Logout (stateless)
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Çıkış başarılı' });
});

// Auth: Me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yetkisiz' });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Me error:', error);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
    const { passwordhash: _ph, ...userWithoutPassword } = user || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Get all users requested');
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Supabase Error:', error);
      return res.json([]);
    }

    // Remove sensitive fields
    const safeUsers = (users || []).map(({ passwordhash, ...u }) => u);
    console.log('Users found:', safeUsers?.length || 0);
    res.json(safeUsers || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.json([]);
  }
});

// Get all operators (admin only)
app.get('/api/admin/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Get all operators requested');
    const { data: operators, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'OPERATOR');

    if (error) {
      console.error('Supabase Error:', error);
      return res.json([]);
    }

    const safeOperators = (operators || []).map(({ passwordhash, ...u }) => u);
    console.log('Operators found:', safeOperators?.length || 0);
    res.json(safeOperators || []);
  } catch (error) {
    console.error('Get operators error:', error);
    res.json([]);
  }
});

// Get users (operator or admin) - only USER role
app.get('/api/operator/users', authMiddleware, operatorOrAdminMiddleware, async (req, res) => {
  try {
    console.log('Operator: get users requested');
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'USER');

    if (error) {
      console.error('Supabase Error:', error);
      return res.json([]);
    }

    const safeUsers = (users || []).map(({ passwordhash, ...u }) => u);
    console.log('Operator: users found:', safeUsers?.length || 0);
    res.json(safeUsers || []);
  } catch (error) {
    console.error('Operator get users error:', error);
    res.json([]);
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    const { passwordhash, ...safe } = data || {};
    res.json({ success: true, data: safe });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Update user (operator or admin) - limited fields
app.put('/api/operator/users/:userId', authMiddleware, operatorOrAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const allowedFields = ['name', 'username', 'bio', 'location', 'avatar', 'socialLinks'];
    const updateData = {};
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    const { passwordhash, ...safe } = data || {};
    res.json({ success: true, data: safe });
  } catch (error) {
    console.error('Operator update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get dashboard stats
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Dashboard stats requested');
    
    // Get user stats
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role');

    if (userError) {
      console.error('User Stats Error:', userError);
      // Don't throw error, just return empty stats
      return res.json({
        totalUsers: 0,
        totalOperators: 0,
        activeUsers: 0,
        realTimeActiveUsers: 0
      });
    }

    console.log('Users data:', users);

    // Try to get active users, but don't fail if table doesn't exist
    let activeUsers = [];
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity')
        .select('user_id')
        .gt('timestamp', fifteenMinutesAgo);

      if (!activityError) {
        activeUsers = activityData || [];
      }
    } catch (activityError) {
      console.log('Activity table not available, using empty data');
    }

    const stats = {
      totalUsers: users?.filter(u => u.role === 'USER').length || 0,
      totalOperators: users?.filter(u => u.role === 'OPERATOR').length || 0,
      activeUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0,
      realTimeActiveUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0
    };

    console.log('Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    // Return empty stats instead of 500 error
    res.json({
      totalUsers: 0,
      totalOperators: 0,
      activeUsers: 0,
      realTimeActiveUsers: 0
    });
  }
});

// Activity tracking endpoint
app.post('/api/users/activity', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log('Activity Tracking:', { timestamp });

    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ success: false, message: 'Activity tracking failed' });
  }
});

// User: Update profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yetkisiz' });
    }

    const allowedFields = ['name', 'email', 'username', 'bio', 'location', 'socialLinks'];
    const updatePayload = {};
    for (const key of allowedFields) {
      if (key in req.body) updatePayload[key] = req.body[key];
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, message: 'Güncellenecek alan yok' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ success: false, message: 'Profil güncellenemedi' });
    }

    const { passwordhash: _ph, ...userWithoutPassword } = updated || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update profile endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// User: Update avatar
app.put('/api/users/avatar', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    const avatar = (req.body && (req.body.avatar || req.body.avatarUrl)) || null;
    if (!userId || !avatar) {
      return res.status(400).json({ success: false, message: 'Geçersiz istek' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ success: false, message: 'Profil fotoğrafı güncellenemedi' });
    }

    const { passwordhash: _ph, ...userWithoutPassword } = updated || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update avatar endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve password gerekli'
      });
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordhash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { passwordhash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin: Add operator
app.post('/api/admin/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, name, username } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Add operator - existing check error:', existingError);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta zaten kayıtlı' });
    }

    const passwordhash = await bcrypt.hash(password, 10);
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, username, email, passwordhash, role: 'OPERATOR' }]);

    if (insertError) {
      console.error('Add operator - insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Operatör eklenemedi' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Add operator error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Admin: Remove operator -> downgrade to USER
app.delete('/api/admin/operators/:operatorId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { error } = await supabase
      .from('users')
      .update({ role: 'USER' })
      .eq('id', operatorId);

    if (error) {
      console.error('Remove operator error:', error);
      return res.status(500).json({ success: false, message: 'Operatör kaldırılamadı' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Remove operator endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// ===== User statistics & favorites =====
// Get my stats (watched, ratings, favorites, memberSince)
app.get('/api/users/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // watched movies count
    let watchedMovies = 0;
    try {
      const { data, error } = await supabase
        .from('user_watch_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!error) watchedMovies = data?.length || data || 0; // count in head mode
    } catch (_) {}

    // ratings count
    let ratings = 0;
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!error) ratings = data?.length || data || 0;
    } catch (_) {}

    // favorites count
    let favorites = 0;
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!error) favorites = data?.length || data || 0;
    } catch (_) {}

    // member since (days)
    let memberSince = null;
    let memberSinceDays = 0;
    try {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('member_since')
        .eq('id', userId)
        .single();
      if (!userErr && userRow) {
        memberSince = userRow.member_since || null;
        if (memberSince) {
          const ms = Date.now() - new Date(memberSince).getTime();
          memberSinceDays = Math.floor(ms / (1000 * 60 * 60 * 24));
        }
      }
    } catch (_) {}

    return res.json({
      watchedMovies,
      ratings,
      favorites,
      memberSince,
      memberSinceDays,
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Favorites: add
app.post('/api/users/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { movieId } = req.body || {};
    if (!userId || !movieId) return res.status(400).json({ message: 'Invalid request' });

    const { error } = await supabase
      .from('user_favorites')
      .upsert({ user_id: userId, movie_id: String(movieId) }, { onConflict: 'user_id,movie_id' });

    if (error) {
      console.error('Add favorite error:', error);
      return res.status(500).json({ message: 'Failed to add favorite' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Favorites add error:', error);
    return res.status(500).json({ message: 'Failed to add favorite' });
  }
});

// Favorites: remove
app.delete('/api/users/favorites/:movieId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { movieId } = req.params;
    if (!userId || !movieId) return res.status(400).json({ message: 'Invalid request' });

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', String(movieId));

    if (error) {
      console.error('Remove favorite error:', error);
      return res.status(500).json({ message: 'Failed to remove favorite' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Favorites remove error:', error);
    return res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

// Favorites: count
app.get('/api/users/favorites/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    const count = data?.length || data || 0;
    return res.json({ count });
  } catch (error) {
    console.error('Favorites count error:', error);
    return res.json({ count: 0 });
  }
});

// Watch logging
app.post('/api/movies/:movieId/watch', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { movieId } = req.params;
    if (!userId || !movieId) return res.status(400).json({ message: 'Invalid request' });

    const { error } = await supabase
      .from('user_watch_history')
      .insert({ user_id: userId, movie_id: String(movieId) });
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error('Watch log error:', error);
    return res.status(500).json({ message: 'Failed to log watch' });
  }
});

// Rate movie
app.post('/api/movies/:movieId/rate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { movieId } = req.params;
    const { rating } = req.body || {};
    if (!userId || !movieId || !rating) return res.status(400).json({ message: 'Invalid request' });

    // Upsert rating (one rating per user/movie)
    const { error } = await supabase
      .from('user_ratings')
      .upsert({ user_id: userId, movie_id: String(movieId), rating: Number(rating) }, { onConflict: 'user_id,movie_id' });
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error('Rate movie error:', error);
    return res.status(500).json({ message: 'Failed to rate movie' });
  }
});

// ===== Public user search & profile =====
app.get('/api/users/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(Number(req.query.limit) || 10, 25);
    if (!q || q.length < 2) return res.json([]);

    const ilike = `%${q}%`;
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, avatarurl, bio, role')
      .or(`name.ilike.${ilike},username.ilike.${ilike}`)
      .limit(limit);

    if (error) {
      console.error('User search error:', error);
      return res.json([]);
    }
    const results = (data || []).map(u => ({
      id: u.id,
      name: u.name || '',
      username: u.username || '',
      avatar: u.avatarurl || null,
      bio: u.bio || '',
      role: u.role || 'USER',
    }));
    return res.json(results);
  } catch (error) {
    console.error('User search exception:', error);
    return res.json([]);
  }
});

app.get('/api/users/public/:username', async (req, res) => {
  try {
    const raw = req.params.username;
    const decoded = decodeURIComponent(String(raw || ''));
    const stripped = decoded.startsWith('@') ? decoded.slice(1) : decoded;
    const param = stripped.trim();
    if (!param) return res.status(400).json({ message: 'Invalid request' });
    const normalized = String(param).trim().toLowerCase();
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(param);
    console.log('PublicProfile request:', { raw, decoded, param, normalized, isUuid });

    // Try by ID first if looks like UUID
    let user = null;
    if (isUuid) {
      // Try common id column names in order
      const idColumns = ['id', 'user_id', 'uuid'];
      for (const col of idColumns) {
        if (user) break;
        const { data: byCol, error: byColErr } = await supabase
          .from('users')
          .select('id, name, username, avatarurl, bio, location')
          .eq(col, param)
          .maybeSingle();
        console.log('PublicProfile by id column', col, { error: byColErr ? byColErr.message : null, found: !!byCol });
        if (!byColErr && byCol) user = byCol;
      }
    }

    // Then try exact username match (original and normalized)
    if (!user) {
      let resp = await supabase
        .from('users')
        .select('id, name, username, avatarurl, bio, location')
        .eq('username', param)
        .maybeSingle();
      if (resp && resp.data) {
        console.log('PublicProfile exact username match (param) found');
        user = resp.data;
      }
    }

    if (!user) {
      let resp2 = await supabase
        .from('users')
        .select('id, name, username, avatarurl, bio, location')
        .eq('username', normalized)
        .maybeSingle();
      if (resp2 && resp2.data) {
        console.log('PublicProfile exact username match (normalized) found');
        user = resp2.data;
      }
    }

    // If not found, try case-insensitive match (partial)
    if (!user) {
      const { data: list, error: ilikeErr } = await supabase
        .from('users')
        .select('id, name, username, avatarurl, bio, location')
        .ilike('username', `%${param}%`)
        .limit(1);
      console.log('PublicProfile ilike param result', { error: ilikeErr ? ilikeErr.message : null, count: list?.length || 0 });
      if (!ilikeErr && Array.isArray(list) && list.length > 0) {
        user = list[0];
      }
    }

    if (!user) {
      const { data: list2, error: ilikeErr2 } = await supabase
        .from('users')
        .select('id, name, username, avatarurl, bio, location')
        .ilike('username', `%${normalized}%`)
        .limit(1);
      console.log('PublicProfile ilike normalized result', { error: ilikeErr2 ? ilikeErr2.message : null, count: list2?.length || 0 });
      if (!ilikeErr2 && Array.isArray(list2) && list2.length > 0) {
        user = list2[0];
      }
    }

    if (!user) {
      console.log('PublicProfile not found for', { param, normalized });
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user.id;
    let favorites = 0, ratings = 0, watchedMovies = 0;
    try {
      const fav = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      favorites = fav?.data?.length || fav?.data || 0;
    } catch (_) {}
    try {
      const rat = await supabase
        .from('user_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      ratings = rat?.data?.length || rat?.data || 0;
    } catch (_) {}
    try {
      const wh = await supabase
        .from('user_watch_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      watchedMovies = wh?.data?.length || wh?.data || 0;
    } catch (_) {}

    const memberSince = null;
    const memberSinceDays = 0;

    return res.json({
      id: user.id,
      name: user.name || '',
      username: user.username || '',
      avatar: user.avatarurl || null,
      bio: user.bio || '',
      location: user.location || '',
      memberSince,
      memberSinceDays,
      stats: { favorites, ratings, watchedMovies },
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});
// Export the Express app for Vercel
export default app;

// For Railway deployment
if (process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  });
}
